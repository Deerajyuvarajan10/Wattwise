"""
Energy-Saving Recommendations Engine for WattWise
Generates personalized tips based on appliance usage patterns.
"""
from typing import List, Dict

class RecommendationsEngine:
    """Rule-based energy saving recommendations."""
    
    # Appliance categories with typical efficient usage patterns
    EFFICIENCY_RULES = {
        "air conditioner": {
            "max_hours": 8,
            "tip": "Set AC to 24-26°C for optimal efficiency. Each degree lower increases energy by 3-5%.",
            "savings_potential": "high"
        },
        "refrigerator": {
            "max_hours": 24,
            "tip": "Keep refrigerator at 3-5°C. Don't overfill and ensure door seals are tight.",
            "savings_potential": "medium"
        },
        "water heater": {
            "max_hours": 2,
            "tip": "Use a timer for water heater. Consider solar water heating for significant savings.",
            "savings_potential": "high"
        },
        "washing machine": {
            "max_hours": 1,
            "tip": "Wash full loads with cold water. This can reduce energy by 90% per load.",
            "savings_potential": "medium"
        },
        "television": {
            "max_hours": 6,
            "tip": "Enable power-saving mode and reduce brightness. Unplug when not in use.",
            "savings_potential": "low"
        },
        "computer": {
            "max_hours": 8,
            "tip": "Use sleep mode when idle. A laptop uses 80% less energy than a desktop.",
            "savings_potential": "medium"
        },
        "fan": {
            "max_hours": 12,
            "tip": "Ceiling fans are more efficient than pedestal fans. Use with AC to save energy.",
            "savings_potential": "low"
        },
        "iron": {
            "max_hours": 1,
            "tip": "Iron in batches and start with delicates. Turn off before finishing the last items.",
            "savings_potential": "medium"
        },
        "microwave": {
            "max_hours": 0.5,
            "tip": "Microwave is more efficient than oven for small portions. Keep it clean for efficiency.",
            "savings_potential": "low"
        },
        "geyser": {
            "max_hours": 1,
            "tip": "Limit geyser usage to 10-15 minutes. Insulate pipes to retain heat.",
            "savings_potential": "high"
        }
    }
    
    GENERAL_TIPS = [
        {
            "title": "Switch to LED Bulbs",
            "description": "LED bulbs use 75% less energy than incandescent and last 25x longer.",
            "category": "lighting",
            "impact": "medium"
        },
        {
            "title": "Unplug Standby Devices",
            "description": "Standby power can account for 5-10% of home energy use. Use power strips.",
            "category": "general",
            "impact": "low"
        },
        {
            "title": "Optimize Peak Hours",
            "description": "Avoid running heavy appliances during 6-10 PM when rates may be higher.",
            "category": "scheduling",
            "impact": "medium"
        },
        {
            "title": "Regular Maintenance",
            "description": "Clean AC filters monthly. Dirty filters can increase energy use by 15%.",
            "category": "maintenance",
            "impact": "medium"
        },
        {
            "title": "Natural Ventilation",
            "description": "Open windows during cool mornings/evenings instead of using AC.",
            "category": "cooling",
            "impact": "high"
        }
    ]
    
    def analyze_appliances(self, appliances: List[Dict]) -> List[Dict]:
        """Analyze appliances and return specific recommendations."""
        recommendations = []
        
        for appliance in appliances:
            name = appliance.get("name", "").lower()
            watts = appliance.get("power_rating_watts", 0)
            hours = appliance.get("usage_duration_hours_per_day", 0)
            daily_kwh = (watts * hours) / 1000
            
            # Check against known appliance rules
            for key, rules in self.EFFICIENCY_RULES.items():
                if key in name:
                    if hours > rules["max_hours"]:
                        recommendations.append({
                            "appliance": appliance.get("name"),
                            "issue": f"Usage exceeds recommended {rules['max_hours']} hours/day",
                            "tip": rules["tip"],
                            "current_hours": hours,
                            "recommended_hours": rules["max_hours"],
                            "potential_savings": rules["savings_potential"],
                            "estimated_daily_kwh": round(daily_kwh, 2)
                        })
                    break
            
            # High consumption warning (>5 kWh/day)
            if daily_kwh > 5:
                recommendations.append({
                    "appliance": appliance.get("name"),
                    "issue": "High daily energy consumption",
                    "tip": f"This appliance uses {daily_kwh:.1f} kWh/day. Consider reducing usage or upgrading to energy-efficient model.",
                    "current_kwh": round(daily_kwh, 2),
                    "potential_savings": "high"
                })
        
        return recommendations
    
    def get_tips_for_usage(self, daily_usage: List[Dict], appliances: List[Dict]) -> Dict:
        """Generate comprehensive tips based on usage and appliances."""
        appliance_tips = self.analyze_appliances(appliances)
        
        # Calculate metrics
        total_daily_avg = 0
        anomaly_count = 0
        
        if daily_usage:
            consumptions = [d.get("consumption_kwh", 0) for d in daily_usage[-30:]]
            total_daily_avg = sum(consumptions) / len(consumptions) if consumptions else 0
            anomaly_count = sum(1 for d in daily_usage[-30:] if d.get("is_anomaly"))
        
        # Usage-based tips
        usage_tips = []
        
        if total_daily_avg > 20:
            usage_tips.append({
                "title": "High Energy Consumer",
                "description": f"Your average daily usage ({total_daily_avg:.1f} kWh) is above typical household. Review high-consumption appliances.",
                "impact": "high"
            })
        
        if anomaly_count > 3:
            usage_tips.append({
                "title": "Frequent Anomalies Detected",
                "description": f"{anomaly_count} unusual usage days in the last month. Investigate potential issues or appliance malfunctions.",
                "impact": "high"
            })
        
        # Shuffle and select general tips
        import random
        selected_general = random.sample(self.GENERAL_TIPS, min(3, len(self.GENERAL_TIPS)))
        
        return {
            "appliance_specific": appliance_tips[:5],  # Limit to top 5
            "usage_based": usage_tips,
            "general_tips": selected_general,
            "summary": {
                "avg_daily_kwh": round(total_daily_avg, 2),
                "total_recommendations": len(appliance_tips) + len(usage_tips),
                "high_priority_count": sum(1 for t in appliance_tips if t.get("potential_savings") == "high")
            }
        }


# Global instance
recommendations_engine = RecommendationsEngine()
