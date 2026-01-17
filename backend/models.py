from pydantic import BaseModel
from typing import Optional
from datetime import date

class Appliance(BaseModel):
    id: Optional[str] = None
    name: str
    power_rating_watts: float
    usage_duration_hours_per_day: float
    category: Optional[str] = "Other"

class MeterReading(BaseModel):
    date: date
    time_of_day: str  # 'morning' or 'night'
    reading_kwh: float

class DailyUsage(BaseModel):
    date: date
    consumption_kwh: float
    cost: float
    is_anomaly: bool = False
    readings_count: int = 0

class UserSettings(BaseModel):
    electricity_rate: float = 8.0
    notifications_enabled: bool = True
    weekly_digest_enabled: bool = True
    theme: str = "dark"

class MonthlyReport(BaseModel):
    month: str
    total_kwh: float
    total_cost: float
    avg_daily_kwh: float
    peak_kwh: float
    min_kwh: float
    anomaly_days: int
    days_recorded: int

class BillPrediction(BaseModel):
    predicted_monthly_kwh: float
    predicted_monthly_cost: float
    avg_daily_kwh: float
    current_month_kwh: float
    current_month_cost: float
