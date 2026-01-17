import json
import os
from typing import List, Dict, Any

DB_FILE = "db.json"

class Database:
    def __init__(self, db_file=DB_FILE):
        self.db_file = db_file
        self._ensure_db()

    def _ensure_db(self):
        if not os.path.exists(self.db_file):
            self._save_data({"appliances": [], "readings": [], "daily_usage": []})

    def _load_data(self) -> Dict[str, Any]:
        with open(self.db_file, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {"appliances": [], "readings": [], "daily_usage": []}

    def _save_data(self, data: Dict[str, Any]):
        with open(self.db_file, "w") as f:
            json.dump(data, f, indent=4, default=str)

    def get_appliances(self, user_id: str):
        data = self._load_data()
        all_apps = data.get("appliances", [])
        return [app for app in all_apps if app.get("userId") == user_id]

    def add_appliance(self, appliance: Dict, user_id: str):
        data = self._load_data()
        appliance["userId"] = user_id
        data.setdefault("appliances", []).append(appliance)
        self._save_data(data)
    
    def delete_appliance(self, app_id: str, user_id: str):
        data = self._load_data()
        apps = data.get("appliances", [])
        # Filter out the specific appliance for this user
        data["appliances"] = [a for a in apps if not (a["id"] == app_id and a.get("userId") == user_id)]
        self._save_data(data)

    def get_readings(self, user_id: str):
        data = self._load_data()
        all_readings = data.get("readings", [])
        return [r for r in all_readings if r.get("userId") == user_id]

    def add_reading(self, reading: Dict, user_id: str):
        data = self._load_data()
        reading["userId"] = user_id
        data.setdefault("readings", []).append(reading)
        self._save_data(data)

    def get_daily_usage(self, user_id: str):
        data = self._load_data()
        all_daily = data.get("daily_usage", [])
        return [d for d in all_daily if d.get("userId") == user_id]

    def save_daily_usage(self, usage: Dict, user_id: str):
        data = self._load_data()
        usage["userId"] = user_id
        daily = data.get("daily_usage", [])
        
        # Remove existing for same date AND same user
        daily = [d for d in daily if not (d["date"] == usage["date"] and d.get("userId") == user_id)]
        
        daily.append(usage)
        data["daily_usage"] = daily
        self._save_data(data)

db = Database()
