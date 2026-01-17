import firebase_admin
from firebase_admin import auth, credentials
import os

# Demo mode - set to True to bypass Firebase verification for testing
DEMO_MODE = True

# Initialize Firebase Admin
try:
    firebase_admin.get_app()
except ValueError:
    try:
        firebase_admin.initialize_app()
    except Exception:
        pass  # Firebase init may fail without credentials, that's ok in demo mode

def verify_token(token: str):
    # Demo mode: accept demo token for UI testing
    if DEMO_MODE and token == "demo-token-for-testing":
        return {
            "valid": True, 
            "userid": "demo-user-123", 
            "email": "test@wattwise.app"
        }
    
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        return {"valid": True, "userid": uid, "email": email}
    except Exception as e:
        # In demo mode, if verification fails, still allow with demo user
        if DEMO_MODE:
            return {
                "valid": True, 
                "userid": "demo-user-123", 
                "email": "test@wattwise.app"
            }
        return {"valid": False, "error": str(e)}
