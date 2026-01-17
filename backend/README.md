# Electricity Monitor Backend

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

- `GET /` - Health check
- `GET /appliances` - List appliances
- `POST /appliances` - Add appliance
- `POST /readings` - Add meter reading (morning/night)
- `GET /daily-usage` - Get daily usage and cost
- `POST /auth/login` - Verify Google ID Token

## Configuration

- Set `GOOGLE_CLIENT_ID` environment variable for authentication.
