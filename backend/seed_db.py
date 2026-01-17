import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import requests
import json
from datetime import date, timedelta
import random

BASE_URL = "http://127.0.0.1:8000"

def seed():
    # 1. Add Appliances
    appliances = [
        {"name": "Refrigerator", "power_rating_watts": 150, "usage_duration_hours_per_day": 24},
        {"name": "AC", "power_rating_watts": 1500, "usage_duration_hours_per_day": 8},
        {"name": "Washing Machine", "power_rating_watts": 500, "usage_duration_hours_per_day": 1}
    ]
    
    # We can use the db directly or API. Let's use DB direct writing for seeding to avoid running server requirement
    # Actually, simpler to write to db.json directly
    
    db_data = {
        "appliances": [],
        "readings": [],
        "daily_usage": []
    }
    
    for app in appliances:
        app["id"] = str(random.randint(1000, 9999))
        db_data["appliances"].append(app)
        
    print(f"Added {len(appliances)} appliances.")

    # 2. Add Readings & Daily Usage
    # Generate 10 days of data
    start_date = date.today() - timedelta(days=10)
    current_reading = 1000.0 # Initial meter reading
    
    for i in range(10):
        day = start_date + timedelta(days=i)
        
        # Morning
        morning_val = current_reading
        db_data["readings"].append({
            "date": str(day),
            "time_of_day": "morning",
            "reading_kwh": round(morning_val, 2)
        })
        
        # Consumption for day (random between 10 and 25 kWh)
        consumption = random.uniform(10, 25)
        
        # Night
        night_val = morning_val + consumption
        db_data["readings"].append({
            "date": str(day),
            "time_of_day": "night",
            "reading_kwh": round(night_val, 2)
        })
        
        # Daily Usage
        cost = consumption * 0.15
        is_anomaly = consumption > 22 # simple rule
        
        db_data["daily_usage"].append({
            "date": str(day),
            "consumption_kwh": round(consumption, 2),
            "cost": round(cost, 2),
            "is_anomaly": is_anomaly,
            "readings_count": 2
        })
        
        current_reading = night_val + random.uniform(2, 5) # Overnight usage
        
    with open("e:/New folder/backend/db.json", "w") as f: # Adjust path relative to where script runs usually
        json.dump(db_data, f, indent=4)
        
    print("Database seeded successfully at backend/db.json")

if __name__ == "__main__":
    seed()
