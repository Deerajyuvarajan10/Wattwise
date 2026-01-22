from fastapi import FastAPI, HTTPException, Body, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import date, datetime
import uuid
import io
import csv

from models import Appliance, MeterReading, DailyUsage
from database_sqlite import db
from ml_engine import ml_engine
from auth import verify_token, DEMO_MODE
from recommendations import recommendations_engine
from email_service import email_service
from slab_rates import calculate_daily_cost, calculate_monthly_bill, get_slab_info, get_all_slabs
from pydantic import BaseModel

app = FastAPI(title="WattWise Backend", version="2.0.0")

# ==================== AUTH ====================

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
         raise HTTPException(status_code=401, detail="Invalid Authorization Header Format. Expected 'Bearer <token>'")
    
    token = parts[1]
    result = verify_token(token)
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=f"Invalid token: {result.get('error')}")
    
    return result

class TokenRequest(BaseModel):
    token: str

@app.post("/auth/login")
def login(request: TokenRequest):
    result = verify_token(request.token)
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=f"Invalid token: {result.get('error')}")
    return {"message": "Login successful", "user": result}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Database initializes on import
    print("=" * 50)
    print("🚀 WattWise Backend Starting...")
    print(f"📡 Server will be available at: http://0.0.0.0:8000")
    print(f"🔧 Demo Mode: {DEMO_MODE}")
    print("=" * 50)

# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"\n📥 {request.method} {request.url.path}")
    print(f"   Client: {request.client.host if request.client else 'unknown'}")
    auth_header = request.headers.get("authorization", "None")
    print(f"   Auth: {auth_header[:50]}..." if len(auth_header) > 50 else f"   Auth: {auth_header}")
    
    response = await call_next(request)
    
    print(f"📤 Response: {response.status_code}")
    return response

@app.get("/")
def read_root():
    return {
        "message": "WattWise Backend is running", 
        "version": "2.0.0",
        "demo_mode": DEMO_MODE,
        "status": "✓ Server is healthy",
        "endpoints": {
            "appliances": "/appliances",
            "readings": "/readings",
            "daily_usage": "/daily-usage",
            "dashboard": "/dashboard/summary"
        }
    }

# ==================== APPLIANCES ====================

@app.get("/appliances", response_model=List[Appliance])
def get_appliances(user: dict = Depends(get_current_user)):
    return db.get_appliances(user["userid"])

@app.post("/appliances", response_model=Appliance)
def add_appliance(appliance: Appliance, user: dict = Depends(get_current_user)):
    print(f"\n➕ Adding appliance for user {user['userid']}")
    print(f"   Name: {appliance.name}, Power: {appliance.power_rating_watts}W, Hours: {appliance.usage_duration_hours_per_day}h/day")
    
    if not appliance.id:
        appliance.id = str(uuid.uuid4())
    db.add_appliance(appliance.dict(), user["userid"])
    
    print(f"   ✓ Appliance added with ID: {appliance.id}")
    return appliance

@app.delete("/appliances/{appliance_id}")
def delete_appliance(appliance_id: str, user: dict = Depends(get_current_user)):
    print(f"\n🗑️  Deleting appliance {appliance_id} for user {user['userid']}")
    db.delete_appliance(appliance_id, user["userid"])
    return {"status": "deleted"}

# ==================== READINGS ====================

@app.get("/readings", response_model=List[MeterReading])
def get_readings(user: dict = Depends(get_current_user)):
    return db.get_readings(user["userid"])

@app.post("/readings")
def add_reading(reading: MeterReading, user: dict = Depends(get_current_user)):
    """
    Add a meter reading.
    Logic:
    - Save reading.
    - Check if we have both morning and night for this date.
    - If so, calculate daily usage and update ML/Stats.
    """
    user_id = user["userid"]
    
    print(f"\n💾 Adding reading for user {user_id}")
    print(f"   Date: {reading.date}, Time: {reading.time_of_day}, Reading: {reading.reading_kwh} kWh")
    
    # Get user's electricity rate
    rate = db.get_electricity_rate(user_id)
    
    db.add_reading(reading.dict(), user_id)
    
    # Check for daily completion
    all_readings = db.get_readings(user_id)
    today_readings = [r for r in all_readings if r["date"] == str(reading.date)]
    
    morning = next((r for r in today_readings if r["time_of_day"] == "morning"), None)
    night = next((r for r in today_readings if r["time_of_day"] == "night"), None)
    
    if morning and night:
        m_val = float(morning["reading_kwh"])
        n_val = float(night["reading_kwh"])
        
        if n_val < m_val:
             consumption = 0
        else:
            consumption = n_val - m_val
        
        print(f"   ✓ Both readings available! Consumption: {consumption} kWh")
        
        # Get estimated monthly usage for accurate slab calculation
        all_daily = db.get_daily_usage(user_id, limit=30)
        if all_daily:
            avg_daily = sum(d["consumption_kwh"] for d in all_daily) / len(all_daily)
            estimated_monthly = avg_daily * 30
        else:
            estimated_monthly = consumption * 30
        
        # Calculate cost using Tamil Nadu slab rates
        cost = calculate_daily_cost(consumption, estimated_monthly)
        is_anomaly = ml_engine.is_anomaly(consumption)
        
        daily_usage = DailyUsage(
            date=reading.date,
            consumption_kwh=round(consumption, 2),
            cost=round(cost, 2),
            is_anomaly=is_anomaly,
            readings_count=2
        )
        
        db.save_daily_usage(daily_usage.dict(), user_id)
        
        print(f"   💰 Daily cost: ₹{cost:.2f}, Anomaly: {is_anomaly}")
        
        # Retrain ML model
        all_daily = db.get_daily_usage(user_id)
        if len(all_daily) > 5:
             ml_engine.train(all_daily)
        
        return {"message": "Reading added. Daily usage calculated.", "daily_usage": daily_usage}

    print(f"   ⏳ Waiting for {'night' if reading.time_of_day == 'morning' else 'morning'} reading")
    return {"message": "Reading added. Waiting for second reading to calculate daily usage."}

class UpdateReadingRequest(BaseModel):
    reading_kwh: float

@app.put("/readings/{date}/{time_of_day}")
def update_reading(
    date: str,
    time_of_day: str,
    request: UpdateReadingRequest,
    user: dict = Depends(get_current_user)
):
    """
    Update an existing meter reading.
    After updating, recalculate daily usage if both readings exist.
    """
    user_id = user["userid"]
    
    # Validate time_of_day
    if time_of_day not in ["morning", "night"]:
        raise HTTPException(status_code=400, detail="time_of_day must be 'morning' or 'night'")
    
    # Validate reading value
    if request.reading_kwh < 0:
        raise HTTPException(status_code=400, detail="Reading must be a positive number")
    
    print(f"\n✏️  Updating reading for user {user_id}")
    print(f"   Date: {date}, Time: {time_of_day}, New Reading: {request.reading_kwh} kWh")
    
    # Check if reading exists
    existing = db.get_reading_by_date_time(user_id, date, time_of_day)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Reading not found for {date} {time_of_day}")
    
    # Update the reading
    success = db.update_reading(user_id, date, time_of_day, request.reading_kwh)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update reading")
    
    print(f"   ✓ Reading updated from {existing['reading_kwh']} to {request.reading_kwh} kWh")
    
    # Recalculate daily usage
    all_readings = db.get_readings(user_id)
    day_readings = [r for r in all_readings if r["date"] == date]
    
    morning = next((r for r in day_readings if r["time_of_day"] == "morning"), None)
    night = next((r for r in day_readings if r["time_of_day"] == "night"), None)
    
    if morning and night:
        m_val = float(morning["reading_kwh"])
        n_val = float(night["reading_kwh"])
        
        if n_val < m_val:
            consumption = 0
        else:
            consumption = n_val - m_val
        
        print(f"   🔄 Recalculating daily usage: {consumption} kWh")
        
        # Get estimated monthly usage for accurate slab calculation
        all_daily = db.get_daily_usage(user_id, limit=30)
        if all_daily:
            avg_daily = sum(d["consumption_kwh"] for d in all_daily) / len(all_daily)
            estimated_monthly = avg_daily * 30
        else:
            estimated_monthly = consumption * 30
        
        # Calculate cost using Tamil Nadu slab rates
        cost = calculate_daily_cost(consumption, estimated_monthly)
        is_anomaly = ml_engine.is_anomaly(consumption)
        
        daily_usage = DailyUsage(
            date=date,
            consumption_kwh=round(consumption, 2),
            cost=round(cost, 2),
            is_anomaly=is_anomaly,
            readings_count=2
        )
        
        db.save_daily_usage(daily_usage.dict(), user_id)
        
        print(f"   💰 Updated daily cost: ₹{cost:.2f}, Anomaly: {is_anomaly}")
        
        # Retrain ML model
        all_daily = db.get_daily_usage(user_id)
        if len(all_daily) > 5:
            ml_engine.train(all_daily)
        
        return {
            "message": "Reading updated. Daily usage recalculated.",
            "reading": {
                "date": date,
                "time_of_day": time_of_day,
                "reading_kwh": request.reading_kwh
            },
            "daily_usage": daily_usage
        }
    
    return {
        "message": "Reading updated successfully.",
        "reading": {
            "date": date,
            "time_of_day": time_of_day,
            "reading_kwh": request.reading_kwh
        }
    }

@app.get("/daily-usage", response_model=List[DailyUsage])
def get_daily_usage(user: dict = Depends(get_current_user)):
    return db.get_daily_usage(user["userid"])

# ==================== REPORTS ====================

@app.get("/reports/monthly")
def get_monthly_report(
    month: str = Query(..., description="Month in YYYY-MM format"),
    user: dict = Depends(get_current_user)
):
    """Get monthly usage report with statistics."""
    try:
        year, mon = month.split("-")
        return db.get_monthly_report(user["userid"], int(year), int(mon))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

@app.get("/reports/comparison")
def get_usage_comparison(user: dict = Depends(get_current_user)):
    """Get this month vs last month comparison."""
    from datetime import date
    user_id = user["userid"]
    today = date.today()
    
    # Current month
    current_year, current_month = today.year, today.month
    current_report = db.get_monthly_report(user_id, current_year, current_month)
    
    # Last month
    if current_month == 1:
        last_year, last_month = current_year - 1, 12
    else:
        last_year, last_month = current_year, current_month - 1
    last_report = db.get_monthly_report(user_id, last_year, last_month)
    
    # Calculate changes
    current_kwh = current_report.get("stats", {}).get("total_kwh", 0) or 0
    last_kwh = last_report.get("stats", {}).get("total_kwh", 0) or 0
    current_cost = current_report.get("stats", {}).get("total_cost", 0) or 0
    last_cost = last_report.get("stats", {}).get("total_cost", 0) or 0
    
    kwh_change = current_kwh - last_kwh
    kwh_change_percent = round((kwh_change / last_kwh * 100), 1) if last_kwh > 0 else 0
    cost_change = current_cost - last_cost
    cost_change_percent = round((cost_change / last_cost * 100), 1) if last_cost > 0 else 0
    
    return {
        "current_month": {
            "month": f"{current_year}-{current_month:02d}",
            "total_kwh": current_kwh,
            "total_cost": current_cost,
            "days_recorded": current_report.get("stats", {}).get("days_recorded", 0)
        },
        "last_month": {
            "month": f"{last_year}-{last_month:02d}",
            "total_kwh": last_kwh,
            "total_cost": last_cost,
            "days_recorded": last_report.get("stats", {}).get("days_recorded", 0)
        },
        "comparison": {
            "kwh_change": round(kwh_change, 2),
            "kwh_change_percent": kwh_change_percent,
            "cost_change": round(cost_change, 2),
            "cost_change_percent": cost_change_percent,
            "is_improved": kwh_change < 0
        }
    }

@app.get("/reports/yearly")
def get_yearly_summary(
    year: int = Query(..., description="Year in YYYY format"),
    user: dict = Depends(get_current_user)
):
    """Get yearly usage summary by month."""
    return db.get_yearly_summary(user["userid"], year)

# ==================== PREDICTIONS ====================

@app.get("/predictions/bill")
def predict_bill(user: dict = Depends(get_current_user)):
    """Predict monthly electricity bill based on usage patterns with slab breakdown."""
    user_id = user["userid"]
    
    # Get average daily usage
    all_daily = db.get_daily_usage(user_id, limit=30)
    if not all_daily:
        return {"message": "No usage data available for prediction"}
    
    avg_daily = sum(d["consumption_kwh"] for d in all_daily) / len(all_daily)
    estimated_monthly = avg_daily * 30
    
    # Calculate using slab rates
    bill = calculate_monthly_bill(estimated_monthly)
    
    # Get current month progress
    from datetime import date
    today = date.today()
    current_month = db.get_monthly_report(user_id, today.year, today.month)
    
    return {
        "predicted_monthly_kwh": round(estimated_monthly, 2),
        "predicted_monthly_cost": bill["total_amount"],
        "avg_daily_kwh": round(avg_daily, 2),
        "slab_breakdown": bill["breakdown"],
        "current_month": {
            "month": today.strftime("%Y-%m"),
            "kwh_so_far": current_month["stats"]["total_kwh"],
            "cost_so_far": current_month["stats"]["total_cost"],
            "days_recorded": current_month["stats"]["days_recorded"]
        },
        "state": "Tamil Nadu"
    }

# ==================== BILLING INFO ====================

@app.get("/billing/slabs")
def get_slab_rates():
    """Get Tamil Nadu electricity slab rates."""
    return {
        "state": "Tamil Nadu",
        "slabs": get_all_slabs(),
        "note": "First 100 units are FREE for domestic consumers"
    }

@app.get("/billing/calculate")
def calculate_bill(
    units: float = Query(..., description="Total units consumed"),
):
    """Calculate electricity bill for given units using Tamil Nadu slab rates."""
    return calculate_monthly_bill(units)

# ==================== ANALYTICS ====================

@app.get("/analytics/patterns")
def get_usage_patterns(user: dict = Depends(get_current_user)):
    """Get usage patterns analysis (weekday vs weekend)."""
    return db.get_usage_patterns(user["userid"])

# ==================== TIPS ====================

@app.get("/tips")
def get_energy_tips(user: dict = Depends(get_current_user)):
    """Get personalized energy-saving recommendations."""
    user_id = user["userid"]
    appliances = db.get_appliances(user_id)
    daily_usage = db.get_daily_usage(user_id, limit=30)
    
    return recommendations_engine.get_tips_for_usage(daily_usage, appliances)

# ==================== SETTINGS ====================

class UserSettings(BaseModel):
    electricity_rate: float = 8.0
    notifications_enabled: bool = True
    weekly_digest_enabled: bool = True
    theme: str = "dark"

@app.get("/settings")
def get_settings(user: dict = Depends(get_current_user)):
    """Get user settings."""
    return db.get_user_settings(user["userid"])

@app.put("/settings")
def update_settings(settings: UserSettings, user: dict = Depends(get_current_user)):
    """Update user settings."""
    db.update_user_settings(user["userid"], settings.dict())
    return {"message": "Settings updated", "settings": settings}

# ==================== EXPORT ====================

@app.get("/export/csv")
def export_data_csv(user: dict = Depends(get_current_user)):
    """Export all usage data as CSV."""
    user_id = user["userid"]
    daily_usage = db.get_daily_usage(user_id, limit=1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Date", "Consumption (kWh)", "Cost (₹)", "Anomaly", "Readings Count"])
    
    # Data rows
    for usage in daily_usage:
        writer.writerow([
            usage["date"],
            usage["consumption_kwh"],
            usage["cost"],
            "Yes" if usage["is_anomaly"] else "No",
            usage["readings_count"]
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=wattwise_usage_{user_id[:8]}.csv"}
    )

@app.get("/export/appliances-csv")
def export_appliances_csv(user: dict = Depends(get_current_user)):
    """Export appliances data as CSV."""
    user_id = user["userid"]
    appliances = db.get_appliances(user_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Name", "Power Rating (W)", "Daily Usage (Hours)", "Est. Daily kWh"])
    
    for app in appliances:
        daily_kwh = (app["power_rating_watts"] * app["usage_duration_hours_per_day"]) / 1000
        writer.writerow([
            app["name"],
            app["power_rating_watts"],
            app["usage_duration_hours_per_day"],
            round(daily_kwh, 2)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=wattwise_appliances_{user_id[:8]}.csv"}
    )

# ==================== DASHBOARD SUMMARY ====================

@app.get("/dashboard/summary")
def get_dashboard_summary(user: dict = Depends(get_current_user)):
    """Get comprehensive dashboard summary in one call."""
    user_id = user["userid"]
    
    # Get today's data
    today = date.today().isoformat()
    daily_usage = db.get_daily_usage(user_id, limit=30)
    today_usage = next((d for d in daily_usage if d["date"] == today), None)
    
    # Calculate stats
    last_7_days = daily_usage[:7]
    week_avg = sum(d["consumption_kwh"] for d in last_7_days) / len(last_7_days) if last_7_days else 0
    week_total = sum(d["consumption_kwh"] for d in last_7_days)
    week_cost = sum(d["cost"] for d in last_7_days)
    
    # Trend calculation
    if len(daily_usage) >= 14:
        this_week = sum(d["consumption_kwh"] for d in daily_usage[:7])
        last_week = sum(d["consumption_kwh"] for d in daily_usage[7:14])
        trend = round(((this_week - last_week) / last_week * 100) if last_week > 0 else 0, 1)
    else:
        trend = 0
    
    # Predictions
    prediction = db.predict_monthly_bill(user_id)
    
    return {
        "today": {
            "consumption_kwh": today_usage["consumption_kwh"] if today_usage else 0,
            "cost": today_usage["cost"] if today_usage else 0,
            "is_anomaly": today_usage["is_anomaly"] if today_usage else False
        },
        "week": {
            "total_kwh": round(week_total, 2),
            "total_cost": round(week_cost, 2),
            "avg_daily_kwh": round(week_avg, 2),
            "trend_percent": trend
        },
        "prediction": prediction,
        "recent_usage": daily_usage[:7]
    }

# ==================== EMAIL ====================

class EmailRequest(BaseModel):
    email: str
    user_name: str

@app.post("/email/weekly-digest")
def send_weekly_digest(request: EmailRequest, user: dict = Depends(get_current_user)):
    """Send weekly digest email to user"""
    user_id = user["userid"]
    
    # Get last 7 days of data
    daily_usage = db.get_daily_usage(user_id, limit=14)
    last_7 = daily_usage[:7]
    prev_7 = daily_usage[7:14]
    
    if not last_7:
        raise HTTPException(status_code=400, detail="No usage data available")
    
    total_kwh = sum(d["consumption_kwh"] for d in last_7)
    total_cost = sum(d["cost"] for d in last_7)
    avg_daily = total_kwh / len(last_7) if last_7 else 0
    anomaly_count = sum(1 for d in last_7 if d["is_anomaly"])
    
    # Calculate trend
    if prev_7:
        prev_total = sum(d["consumption_kwh"] for d in prev_7)
        trend = ((total_kwh - prev_total) / prev_total * 100) if prev_total > 0 else 0
    else:
        trend = 0
    
    weekly_data = {
        "total_kwh": total_kwh,
        "total_cost": total_cost,
        "avg_daily_kwh": avg_daily,
        "anomaly_count": anomaly_count,
        "trend_percent": trend
    }
    
    success = email_service.send_weekly_digest(
        request.email,
        request.user_name,
        weekly_data
    )
    
    return {"sent": success, "data": weekly_data}

@app.post("/email/test")
def test_email(request: EmailRequest):
    """Send a test email"""
    success = email_service.send_email(
        request.email,
        "WattWise Test Email",
        "<h1>Test Email</h1><p>Your email configuration is working!</p>",
        "Test Email - Your email configuration is working!"
    )
    return {"sent": success}

# ==================== BILLING CYCLE ====================

class BillingCycleRequest(BaseModel):
    last_bill_date: str
    last_bill_reading: float
    last_bill_amount: Optional[float] = None
    billing_period_months: int = 2

@app.post("/billing-cycle")
def save_billing_cycle(request: BillingCycleRequest, user: dict = Depends(get_current_user)):
    """Save billing cycle information from last TNEB bill"""
    user_id = user["userid"]
    
    print(f"\n💰 Saving billing cycle for user {user_id}")
    print(f"   Last bill date: {request.last_bill_date}")
    print(f"   Last bill reading: {request.last_bill_reading} kWh")
    
    cycle_data = {
        "last_bill_date": request.last_bill_date,
        "last_bill_reading": request.last_bill_reading,
        "last_bill_amount": request.last_bill_amount,
        "billing_period_months": request.billing_period_months
    }
    
    db.save_billing_cycle(user_id, cycle_data)
    
    return {"message": "Billing cycle saved successfully", "data": cycle_data}

@app.get("/billing-cycle")
def get_billing_cycle_status(user: dict = Depends(get_current_user)):
    """Get current billing cycle status"""
    user_id = user["userid"]
    
    cycle_info = db.get_current_cycle_consumption(user_id)
    
    if not cycle_info:
        return {"has_cycle": False, "message": "No billing cycle configured"}
    
    # Calculate days in cycle and estimated end
    from datetime import datetime, timedelta
    try:
        last_bill_date = datetime.fromisoformat(cycle_info["last_bill_date"])
        today = datetime.now()
        days_in_cycle = (today - last_bill_date).days
        
        # TNEB billing is typically 60 days
        estimated_end = last_bill_date + timedelta(days=60)
        
        # Determine current slab based on consumption
        consumption = cycle_info["cycle_consumption"]
        slab_info = get_slab_info(consumption, is_bimonthly=True)
        
        return {
            "has_cycle": True,
            "last_bill_date": cycle_info["last_bill_date"],
            "last_bill_reading": cycle_info["last_bill_reading"],
            "current_reading": cycle_info["current_reading"],
            "cycle_consumption": cycle_info["cycle_consumption"],
            "current_slab": slab_info["current_slab"],
            "current_rate": slab_info["current_rate"],
            "days_in_cycle": days_in_cycle,
            "days_remaining": max(0, 60 - days_in_cycle),
            "cycle_ending_soon": days_in_cycle >= 55,  # Alert when 5 days or less remaining
            "cycle_ended": days_in_cycle >= 60,  # Cycle has ended, prompt to update
            "estimated_cycle_end": estimated_end.strftime("%Y-%m-%d"),
            "billing_period_months": cycle_info["billing_period_months"]
        }
    except Exception as e:
        print(f"Error calculating cycle status: {e}")
        return {
            "has_cycle": True,
            **cycle_info,
            "days_in_cycle": 0,
            "estimated_cycle_end": None
        }

# ==================== BUDGET GOALS ====================

class BudgetSettings(BaseModel):
    monthly_kwh_goal: float = None
    monthly_cost_goal: float = None
    alert_threshold: float = 80.0

@app.post("/budget")
def save_budget(budget: BudgetSettings, user: dict = Depends(get_current_user)):
    """Save user budget/goals"""
    user_id = user["userid"]
    db.save_budget(user_id, budget.dict())
    return {"message": "Budget saved successfully"}

@app.get("/budget")
def get_budget(user: dict = Depends(get_current_user)):
    """Get user budget with progress"""
    user_id = user["userid"]
    budget = db.get_budget(user_id)
    
    if not budget:
        return {"has_budget": False, "message": "No budget set"}
    
    return {
        "has_budget": True,
        **budget
    }
