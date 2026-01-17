"""
Enhanced Anomaly Detection Engine for WattWise
Uses Isolation Forest with improved tuning and fallback heuristics.
"""
import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            contamination=0.1,  # 10% anomaly rate - more balanced
            random_state=42,
            n_estimators=100,
            max_samples='auto'
        )
        self.is_fitted = False
        self.historical_mean = 0
        self.historical_std = 0
        self.min_data_points = 5
    
    def train(self, historical_data: List[Dict]) -> bool:
        """
        Train the model on historical daily usage data.
        Returns True if training was successful.
        """
        if len(historical_data) < self.min_data_points:
            return False
        
        df = pd.DataFrame(historical_data)
        if 'consumption_kwh' not in df.columns:
            return False
        
        # Filter out invalid data
        df = df[df['consumption_kwh'] > 0]
        
        if len(df) < self.min_data_points:
            return False
        
        X = df[['consumption_kwh']].values
        
        # Store statistics for fallback detection
        self.historical_mean = float(np.mean(X))
        self.historical_std = float(np.std(X))
        
        # Only train if we have enough variance
        if self.historical_std > 0.1:
            self.model.fit(X)
            self.is_fitted = True
            return True
        
        return False
    
    def is_anomaly(self, current_consumption: float) -> bool:
        """
        Check if the current consumption is an anomaly.
        Uses ML model if trained, otherwise falls back to statistical method.
        """
        if current_consumption <= 0:
            return False
        
        if self.is_fitted:
            prediction = self.model.predict([[current_consumption]])
            # -1 for outliers, 1 for inliers
            return prediction[0] == -1
        
        # Fallback: Statistical method (Z-score based)
        if self.historical_std > 0:
            z_score = abs(current_consumption - self.historical_mean) / self.historical_std
            return z_score > 2.5  # More than 2.5 standard deviations
        
        # Ultimate fallback: Fixed thresholds
        return current_consumption > 50.0 or current_consumption < 0.5
    
    def get_anomaly_score(self, current_consumption: float) -> float:
        """
        Get anomaly score (lower = more anomalous).
        Returns value between -1 (most anomalous) and 1 (most normal).
        """
        if not self.is_fitted:
            return 0.0
        
        score = self.model.decision_function([[current_consumption]])
        return float(score[0])
    
    def analyze_trend(self, daily_data: List[Dict], days: int = 7) -> Dict:
        """
        Analyze usage trend over recent days.
        """
        if len(daily_data) < 2:
            return {"trend": "insufficient_data", "change_percent": 0}
        
        recent = daily_data[:days] if len(daily_data) >= days else daily_data
        
        if len(recent) < 2:
            return {"trend": "insufficient_data", "change_percent": 0}
        
        # Sort by date
        sorted_data = sorted(recent, key=lambda x: x.get("date", ""))
        
        first_half = sorted_data[:len(sorted_data)//2]
        second_half = sorted_data[len(sorted_data)//2:]
        
        avg_first = np.mean([d["consumption_kwh"] for d in first_half])
        avg_second = np.mean([d["consumption_kwh"] for d in second_half])
        
        if avg_first > 0:
            change = ((avg_second - avg_first) / avg_first) * 100
        else:
            change = 0
        
        if change > 10:
            trend = "increasing"
        elif change < -10:
            trend = "decreasing"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "change_percent": round(change, 1),
            "avg_recent": round(avg_second, 2),
            "avg_previous": round(avg_first, 2)
        }
    
    def detect_patterns(self, daily_data: List[Dict]) -> Dict:
        """
        Detect usage patterns from historical data.
        """
        if len(daily_data) < 7:
            return {"patterns_detected": False, "reason": "insufficient_data"}
        
        df = pd.DataFrame(daily_data)
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek  # 0=Monday, 6=Sunday
        
        # Weekend vs Weekday
        weekday = df[df['day_of_week'] < 5]['consumption_kwh'].mean()
        weekend = df[df['day_of_week'] >= 5]['consumption_kwh'].mean()
        
        patterns = {
            "patterns_detected": True,
            "weekday_avg": round(weekday, 2) if not np.isnan(weekday) else 0,
            "weekend_avg": round(weekend, 2) if not np.isnan(weekend) else 0,
            "peak_day": None,
            "low_day": None
        }
        
        # Find peak and low days
        day_avg = df.groupby('day_of_week')['consumption_kwh'].mean()
        if len(day_avg) > 0:
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            patterns["peak_day"] = day_names[day_avg.idxmax()]
            patterns["low_day"] = day_names[day_avg.idxmin()]
        
        return patterns


# Global instance
ml_engine = AnomalyDetector()
