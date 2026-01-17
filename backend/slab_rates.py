"""
Tamil Nadu Electricity Slab Rate Calculator
Based on TNEB domestic tariff rates

IMPORTANT: TNEB uses BI-MONTHLY billing (once every 2 months)
The 100 free units apply to each 2-month billing period.
"""
from typing import Dict, List

# Tamil Nadu Domestic Electricity Slab Rates (in ₹ per unit/kWh)
# These slabs are for BI-MONTHLY (2 month) billing periods
TAMILNADU_SLABS_BIMONTHLY = [
    {"min": 0, "max": 100, "rate": 0.00},      # Free (for 2 months combined)
    {"min": 101, "max": 200, "rate": 2.35},
    {"min": 201, "max": 400, "rate": 4.70},
    {"min": 401, "max": 500, "rate": 6.30},
    {"min": 501, "max": 600, "rate": 8.40},
    {"min": 601, "max": 800, "rate": 9.45},
    {"min": 801, "max": 1000, "rate": 10.50},
    {"min": 1001, "max": float('inf'), "rate": 11.55},
]

# Billing cycle type
BILLING_CYCLE = "bi-monthly"  # 2 months


def calculate_bimonthly_bill(total_units: float) -> Dict:
    """
    Calculate electricity bill using Tamil Nadu bi-monthly slab rates.
    
    Args:
        total_units: Total bi-monthly (2-month) consumption in kWh/units
    
    Returns:
        Dictionary with bill breakdown
    """
    total_units = max(0, total_units)
    remaining_units = total_units
    total_cost = 0.0
    breakdown = []
    
    for slab in TAMILNADU_SLABS_BIMONTHLY:
        if remaining_units <= 0:
            break
        
        slab_min = slab["min"]
        slab_max = slab["max"]
        rate = slab["rate"]
        
        # Calculate units in this slab
        if slab_max == float('inf'):
            units_in_slab = remaining_units
        else:
            slab_range = slab_max - slab_min + 1
            units_in_slab = min(remaining_units, slab_range)
        
        # Calculate cost for this slab
        slab_cost = units_in_slab * rate
        total_cost += slab_cost
        
        if units_in_slab > 0:
            breakdown.append({
                "slab": f"{slab_min}-{slab_max if slab_max != float('inf') else '∞'}",
                "units": round(units_in_slab, 2),
                "rate": rate,
                "amount": round(slab_cost, 2)
            })
        
        remaining_units -= units_in_slab
    
    # Calculate average rate
    avg_rate = total_cost / total_units if total_units > 0 else 0
    
    return {
        "total_units": round(total_units, 2),
        "total_amount": round(total_cost, 2),
        "average_rate": round(avg_rate, 2),
        "breakdown": breakdown,
        "billing_cycle": "bi-monthly (2 months)",
        "state": "Tamil Nadu"
    }


def calculate_monthly_bill(monthly_units: float) -> Dict:
    """
    Calculate estimated monthly bill.
    Since TNEB bills bi-monthly, we project to 2 months for accurate slab calculation,
    then divide by 2 for monthly estimate.
    
    Args:
        monthly_units: Monthly consumption in kWh
    
    Returns:
        Dictionary with estimated monthly bill
    """
    # Project to bi-monthly for accurate slab calculation
    bimonthly_units = monthly_units * 2
    bimonthly_bill = calculate_bimonthly_bill(bimonthly_units)
    
    # Monthly estimate is half of bi-monthly
    return {
        "total_units": round(monthly_units, 2),
        "total_amount": round(bimonthly_bill["total_amount"] / 2, 2),
        "bimonthly_total": bimonthly_bill["total_amount"],
        "average_rate": bimonthly_bill["average_rate"],
        "breakdown": bimonthly_bill["breakdown"],
        "note": "Actual TNEB bill is bi-monthly. This is monthly estimate.",
        "state": "Tamil Nadu"
    }


def calculate_daily_cost(daily_kwh: float, monthly_estimate_kwh: float = None) -> float:
    """
    Calculate daily cost based on estimated monthly usage slab.
    
    Args:
        daily_kwh: Daily consumption in kWh
        monthly_estimate_kwh: Estimated monthly total (default: daily * 30)
    
    Returns:
        Estimated daily cost in ₹
    """
    if monthly_estimate_kwh is None:
        monthly_estimate_kwh = daily_kwh * 30
    
    # Get monthly bill estimate
    monthly_bill = calculate_monthly_bill(monthly_estimate_kwh)
    
    # Calculate daily cost proportionally
    if monthly_estimate_kwh > 0:
        daily_cost = (daily_kwh / monthly_estimate_kwh) * monthly_bill["total_amount"]
    else:
        daily_cost = 0
    
    return round(daily_cost, 2)


def get_slab_info(units: float, is_bimonthly: bool = True) -> Dict:
    """
    Get the slab information for given units.
    
    Args:
        units: Consumption in units/kWh
        is_bimonthly: If True, units are for bi-monthly period
    
    Returns:
        Current slab rate info
    """
    if not is_bimonthly:
        units = units * 2  # Convert to bi-monthly
    
    for slab in TAMILNADU_SLABS_BIMONTHLY:
        if units <= slab["max"]:
            return {
                "current_slab": f"{slab['min']}-{slab['max']}",
                "current_rate": slab["rate"],
                "next_slab_at": slab["max"] + 1 if slab["max"] != float('inf') else None,
                "units_to_next_slab": max(0, slab["max"] - units + 1) if slab["max"] != float('inf') else None,
                "billing_cycle": "bi-monthly"
            }
    
    return {
        "current_slab": "1001+",
        "current_rate": 11.55,
        "next_slab_at": None,
        "units_to_next_slab": None,
        "billing_cycle": "bi-monthly"
    }


def get_all_slabs() -> List[Dict]:
    """Get all slab rates with bi-monthly info"""
    return [
        {
            "range": f"{s['min']}-{int(s['max']) if s['max'] != float('inf') else '∞'}",
            "rate": s["rate"],
            "note": "FREE (for 2 months)" if s["rate"] == 0 else f"₹{s['rate']}/unit"
        }
        for s in TAMILNADU_SLABS_BIMONTHLY
    ]
