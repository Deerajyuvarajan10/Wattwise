"""
Email Service for WattWise
Sends weekly digests and alerts via SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
from datetime import datetime, timedelta
import os

# Configuration - Set these environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@wattwise.app")
FROM_NAME = os.getenv("FROM_NAME", "WattWise")

class EmailService:
    def __init__(self):
        self.enabled = bool(SMTP_USER and SMTP_PASSWORD)
        if not self.enabled:
            print("⚠️ Email service disabled: SMTP credentials not configured")
    
    def _create_connection(self):
        """Create SMTP connection"""
        if not self.enabled:
            return None
        
        try:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            return server
        except Exception as e:
            print(f"SMTP connection error: {e}")
            return None
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send an email"""
        if not self.enabled:
            print(f"Email skipped (not configured): {subject} -> {to_email}")
            return False
        
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
            msg["To"] = to_email
            
            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))
            
            server = self._create_connection()
            if server:
                server.sendmail(FROM_EMAIL, to_email, msg.as_string())
                server.quit()
                return True
            return False
        except Exception as e:
            print(f"Email send error: {e}")
            return False
    
    def send_weekly_digest(
        self,
        to_email: str,
        user_name: str,
        weekly_data: dict
    ) -> bool:
        """Send weekly usage digest"""
        subject = f"⚡ Your Weekly Energy Report - WattWise"
        
        total_kwh = weekly_data.get("total_kwh", 0)
        total_cost = weekly_data.get("total_cost", 0)
        avg_daily = weekly_data.get("avg_daily_kwh", 0)
        anomalies = weekly_data.get("anomaly_count", 0)
        trend = weekly_data.get("trend_percent", 0)
        
        trend_text = "📈 Up" if trend > 0 else "📉 Down" if trend < 0 else "➡️ Stable"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px;">
                <h1 style="color: #00f3ff; text-align: center;">⚡ WattWise Weekly Report</h1>
                <p>Hi {user_name},</p>
                <p>Here's your energy consumption summary for the past week:</p>
                
                <div style="background: linear-gradient(135deg, #040b14, #0a1525); border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; color: white;">
                        <tr>
                            <td style="padding: 10px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #00f3ff;">{total_kwh:.1f}</div>
                                <div style="color: #a0aab5;">kWh Total</div>
                            </td>
                            <td style="padding: 10px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #00ff9d;">₹{total_cost:.0f}</div>
                                <div style="color: #a0aab5;">Total Cost</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; text-align: center;">
                                <div style="font-size: 24px; font-weight: bold;">{avg_daily:.1f}</div>
                                <div style="color: #a0aab5;">Avg kWh/Day</div>
                            </td>
                            <td style="padding: 10px; text-align: center;">
                                <div style="font-size: 24px; font-weight: bold;">{trend_text} {abs(trend):.1f}%</div>
                                <div style="color: #a0aab5;">vs Last Week</div>
                            </td>
                        </tr>
                    </table>
                </div>
                
                {"<p style='color: #ff3333;'>⚠️ " + str(anomalies) + " unusual usage day(s) detected this week.</p>" if anomalies > 0 else ""}
                
                <p style="color: #666;">Keep tracking your usage to save energy and money!</p>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="#" style="background: #00f3ff; color: #000; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold;">
                        Open WattWise App
                    </a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    You're receiving this email because you enabled weekly digests in WattWise.
                    <br>To unsubscribe, update your settings in the app.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        WattWise Weekly Report
        
        Hi {user_name},
        
        Your energy summary for the past week:
        - Total Usage: {total_kwh:.1f} kWh
        - Total Cost: ₹{total_cost:.0f}
        - Average: {avg_daily:.1f} kWh/day
        - Trend: {trend_text} {abs(trend):.1f}%
        
        {"⚠️ " + str(anomalies) + " unusual usage days detected." if anomalies > 0 else ""}
        
        Keep tracking your usage to save energy!
        
        - WattWise Team
        """
        
        return self.send_email(to_email, subject, html_body, text_body)
    
    def send_anomaly_alert(
        self,
        to_email: str,
        user_name: str,
        date: str,
        consumption: float,
        average: float
    ) -> bool:
        """Send anomaly alert email"""
        subject = f"⚠️ Unusual Energy Usage Detected - WattWise"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #fff3cd; border: 1px solid #ffc107; border-radius: 10px; padding: 20px;">
                <h2 style="color: #856404;">⚠️ Unusual Usage Alert</h2>
                <p>Hi {user_name},</p>
                <p>We detected unusually high energy consumption on <strong>{date}</strong>:</p>
                <ul>
                    <li>Consumption: <strong>{consumption:.1f} kWh</strong></li>
                    <li>Your average: <strong>{average:.1f} kWh</strong></li>
                    <li>Difference: <strong>{((consumption - average) / average * 100):.0f}% higher</strong></li>
                </ul>
                <p>This could indicate:</p>
                <ul>
                    <li>An appliance left running</li>
                    <li>A malfunctioning device</li>
                    <li>Unusual household activity</li>
                </ul>
                <p>Check your appliances and usage patterns.</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_body)


# Global instance
email_service = EmailService()
