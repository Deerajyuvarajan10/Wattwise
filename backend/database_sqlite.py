"""
SQLite Database Module for WattWise
Provides persistent storage with proper schema for multi-user support.
"""
import sqlite3
import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from contextlib import contextmanager

DB_FILE = "wattwise.db"

class Database:
    def __init__(self, db_file: str = DB_FILE):
        self.db_file = db_file
        self._init_db()
        self._migrate_from_json()

    @contextmanager
    def _get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self):
        """Initialize database schema."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Users table (for future expansion)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT,
                    name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Appliances table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS appliances (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    power_rating_watts REAL NOT NULL,
                    usage_duration_hours_per_day REAL NOT NULL,
                    category TEXT DEFAULT 'Other',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # Meter readings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time_of_day TEXT NOT NULL CHECK(time_of_day IN ('morning', 'night')),
                    reading_kwh REAL NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, date, time_of_day),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # Daily usage table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    consumption_kwh REAL NOT NULL,
                    cost REAL NOT NULL,
                    is_anomaly INTEGER DEFAULT 0,
                    readings_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, date),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # User settings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_settings (
                    user_id TEXT PRIMARY KEY,
                    electricity_rate REAL DEFAULT 8.0,
                    notifications_enabled INTEGER DEFAULT 1,
                    weekly_digest_enabled INTEGER DEFAULT 1,
                    theme TEXT DEFAULT 'dark',
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # Create indexes for performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_appliances_user ON appliances(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_user ON readings(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_date ON readings(date)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_daily_usage_user ON daily_usage(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date)")

    def _migrate_from_json(self):
        """Migrate existing data from db.json to SQLite."""
        json_file = "db.json"
        if not os.path.exists(json_file):
            return
        
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if already migrated
            cursor.execute("SELECT COUNT(*) FROM appliances")
            if cursor.fetchone()[0] > 0:
                return  # Already has data
            
            # Migrate appliances
            for app in data.get("appliances", []):
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO appliances 
                        (id, user_id, name, power_rating_watts, usage_duration_hours_per_day)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        app.get("id"),
                        app.get("userId", "default"),
                        app.get("name"),
                        app.get("power_rating_watts"),
                        app.get("usage_duration_hours_per_day")
                    ))
                except Exception:
                    pass
            
            # Migrate readings
            for reading in data.get("readings", []):
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO readings 
                        (user_id, date, time_of_day, reading_kwh)
                        VALUES (?, ?, ?, ?)
                    """, (
                        reading.get("userId", "default"),
                        reading.get("date"),
                        reading.get("time_of_day"),
                        reading.get("reading_kwh")
                    ))
                except Exception:
                    pass
            
            # Migrate daily usage
            for usage in data.get("daily_usage", []):
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO daily_usage 
                        (user_id, date, consumption_kwh, cost, is_anomaly, readings_count)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        usage.get("userId", "default"),
                        usage.get("date"),
                        usage.get("consumption_kwh"),
                        usage.get("cost"),
                        1 if usage.get("is_anomaly") else 0,
                        usage.get("readings_count", 0)
                    ))
                except Exception:
                    pass
        
        # Rename old file to backup
        try:
            os.rename(json_file, "db.json.backup")
        except Exception:
            pass

    # ==================== APPLIANCES ====================
    
    def get_appliances(self, user_id: str) -> List[Dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, power_rating_watts, usage_duration_hours_per_day, category
                FROM appliances WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]

    def add_appliance(self, appliance: Dict, user_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO appliances 
                (id, user_id, name, power_rating_watts, usage_duration_hours_per_day, category)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                appliance.get("id"),
                user_id,
                appliance.get("name"),
                appliance.get("power_rating_watts"),
                appliance.get("usage_duration_hours_per_day"),
                appliance.get("category", "Other")
            ))

    def delete_appliance(self, app_id: str, user_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM appliances WHERE id = ? AND user_id = ?",
                (app_id, user_id)
            )

    # ==================== READINGS ====================
    
    def get_readings(self, user_id: str) -> List[Dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT date, time_of_day, reading_kwh
                FROM readings WHERE user_id = ?
                ORDER BY date DESC, time_of_day
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]

    def add_reading(self, reading: Dict, user_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO readings 
                (user_id, date, time_of_day, reading_kwh)
                VALUES (?, ?, ?, ?)
            """, (
                user_id,
                reading.get("date"),
                reading.get("time_of_day"),
                reading.get("reading_kwh")
            ))

    # ==================== DAILY USAGE ====================
    
    def get_daily_usage(self, user_id: str, limit: int = 100) -> List[Dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT date, consumption_kwh, cost, is_anomaly, readings_count
                FROM daily_usage WHERE user_id = ?
                ORDER BY date DESC
                LIMIT ?
            """, (user_id, limit))
            rows = cursor.fetchall()
            return [
                {
                    "date": row["date"],
                    "consumption_kwh": row["consumption_kwh"],
                    "cost": row["cost"],
                    "is_anomaly": bool(row["is_anomaly"]),
                    "readings_count": row["readings_count"]
                }
                for row in rows
            ]

    def save_daily_usage(self, usage: Dict, user_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO daily_usage 
                (user_id, date, consumption_kwh, cost, is_anomaly, readings_count)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                usage.get("date"),
                usage.get("consumption_kwh"),
                usage.get("cost"),
                1 if usage.get("is_anomaly") else 0,
                usage.get("readings_count", 0)
            ))

    # ==================== REPORTS & ANALYTICS ====================
    
    def get_monthly_report(self, user_id: str, year: int, month: int) -> Dict:
        """Get monthly usage statistics."""
        month_str = f"{year}-{month:02d}"
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Get daily data for the month
            cursor.execute("""
                SELECT 
                    COUNT(*) as days_recorded,
                    SUM(consumption_kwh) as total_kwh,
                    SUM(cost) as total_cost,
                    AVG(consumption_kwh) as avg_daily_kwh,
                    MAX(consumption_kwh) as peak_kwh,
                    MIN(consumption_kwh) as min_kwh,
                    SUM(CASE WHEN is_anomaly = 1 THEN 1 ELSE 0 END) as anomaly_days
                FROM daily_usage 
                WHERE user_id = ? AND date LIKE ?
            """, (user_id, f"{month_str}%"))
            
            stats = dict(cursor.fetchone())
            
            # Get daily breakdown
            cursor.execute("""
                SELECT date, consumption_kwh, cost, is_anomaly
                FROM daily_usage 
                WHERE user_id = ? AND date LIKE ?
                ORDER BY date
            """, (user_id, f"{month_str}%"))
            
            daily_data = [
                {
                    "date": row["date"],
                    "consumption_kwh": row["consumption_kwh"],
                    "cost": row["cost"],
                    "is_anomaly": bool(row["is_anomaly"])
                }
                for row in cursor.fetchall()
            ]
            
            return {
                "month": month_str,
                "stats": {
                    "days_recorded": stats["days_recorded"] or 0,
                    "total_kwh": round(stats["total_kwh"] or 0, 2),
                    "total_cost": round(stats["total_cost"] or 0, 2),
                    "avg_daily_kwh": round(stats["avg_daily_kwh"] or 0, 2),
                    "peak_kwh": round(stats["peak_kwh"] or 0, 2),
                    "min_kwh": round(stats["min_kwh"] or 0, 2),
                    "anomaly_days": stats["anomaly_days"] or 0
                },
                "daily_data": daily_data
            }

    def get_yearly_summary(self, user_id: str, year: int) -> Dict:
        """Get yearly usage summary by month."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    strftime('%m', date) as month,
                    SUM(consumption_kwh) as total_kwh,
                    SUM(cost) as total_cost,
                    COUNT(*) as days_recorded
                FROM daily_usage 
                WHERE user_id = ? AND date LIKE ?
                GROUP BY strftime('%m', date)
                ORDER BY month
            """, (user_id, f"{year}%"))
            
            monthly_data = [
                {
                    "month": int(row["month"]),
                    "total_kwh": round(row["total_kwh"] or 0, 2),
                    "total_cost": round(row["total_cost"] or 0, 2),
                    "days_recorded": row["days_recorded"]
                }
                for row in cursor.fetchall()
            ]
            
            # Calculate totals
            total_kwh = sum(m["total_kwh"] for m in monthly_data)
            total_cost = sum(m["total_cost"] for m in monthly_data)
            
            return {
                "year": year,
                "monthly_data": monthly_data,
                "totals": {
                    "total_kwh": round(total_kwh, 2),
                    "total_cost": round(total_cost, 2),
                    "months_recorded": len(monthly_data)
                }
            }

    def predict_monthly_bill(self, user_id: str) -> Dict:
        """Predict monthly bill based on recent usage patterns."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Get last 30 days of usage
            cursor.execute("""
                SELECT AVG(consumption_kwh) as avg_daily, AVG(cost) as avg_cost
                FROM daily_usage 
                WHERE user_id = ?
                ORDER BY date DESC
                LIMIT 30
            """, (user_id,))
            
            result = cursor.fetchone()
            avg_daily = result["avg_daily"] or 0
            avg_cost = result["avg_cost"] or 0
            
            # Project to 30 days
            predicted_kwh = round(avg_daily * 30, 2)
            predicted_cost = round(avg_cost * 30, 2)
            
            # Get current month progress
            today = date.today()
            month_str = today.strftime("%Y-%m")
            
            cursor.execute("""
                SELECT SUM(consumption_kwh) as current_kwh, SUM(cost) as current_cost
                FROM daily_usage 
                WHERE user_id = ? AND date LIKE ?
            """, (user_id, f"{month_str}%"))
            
            current = cursor.fetchone()
            
            return {
                "predicted_monthly_kwh": predicted_kwh,
                "predicted_monthly_cost": predicted_cost,
                "avg_daily_kwh": round(avg_daily, 2),
                "avg_daily_cost": round(avg_cost, 2),
                "current_month": {
                    "month": month_str,
                    "kwh_so_far": round(current["current_kwh"] or 0, 2),
                    "cost_so_far": round(current["current_cost"] or 0, 2),
                    "days_recorded": today.day
                }
            }

    def get_usage_patterns(self, user_id: str) -> Dict:
        """Analyze usage patterns (weekday vs weekend)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # SQLite uses strftime('%w', date) where 0=Sunday, 6=Saturday
            cursor.execute("""
                SELECT 
                    CASE 
                        WHEN strftime('%w', date) IN ('0', '6') THEN 'weekend'
                        ELSE 'weekday'
                    END as day_type,
                    AVG(consumption_kwh) as avg_kwh,
                    COUNT(*) as count
                FROM daily_usage 
                WHERE user_id = ?
                GROUP BY day_type
            """, (user_id,))
            
            patterns = {row["day_type"]: round(row["avg_kwh"] or 0, 2) for row in cursor.fetchall()}
            
            return {
                "weekday_avg_kwh": patterns.get("weekday", 0),
                "weekend_avg_kwh": patterns.get("weekend", 0),
                "pattern": "higher_weekends" if patterns.get("weekend", 0) > patterns.get("weekday", 0) else "higher_weekdays"
            }

    # ==================== USER SETTINGS ====================
    
    def get_user_settings(self, user_id: str) -> Dict:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM user_settings WHERE user_id = ?",
                (user_id,)
            )
            row = cursor.fetchone()
            
            if row:
                return dict(row)
            
            # Create default settings
            cursor.execute("""
                INSERT INTO user_settings (user_id) VALUES (?)
            """, (user_id,))
            
            return {
                "user_id": user_id,
                "electricity_rate": 8.0,
                "notifications_enabled": True,
                "weekly_digest_enabled": True,
                "theme": "dark"
            }

    def update_user_settings(self, user_id: str, settings: Dict):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO user_settings 
                (user_id, electricity_rate, notifications_enabled, weekly_digest_enabled, theme)
                VALUES (?, ?, ?, ?, ?)
            """, (
                user_id,
                settings.get("electricity_rate", 8.0),
                1 if settings.get("notifications_enabled", True) else 0,
                1 if settings.get("weekly_digest_enabled", True) else 0,
                settings.get("theme", "dark")
            ))

    def get_electricity_rate(self, user_id: str) -> float:
        settings = self.get_user_settings(user_id)
        return settings.get("electricity_rate", 8.0)


# Global instance
db = Database()
