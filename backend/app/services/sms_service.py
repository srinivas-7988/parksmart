import os
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


async def send_sms_otp(phone: str, otp: str) -> bool:
    """
    Sends real SMS OTP to mobile phone number.
    Supports Fast2SMS (India quick OTP route) and Twilio.
    Gracefully logs if credentials are not configured or balance runs out.
    """
    raw_key = os.getenv("FAST2SMS_API_KEY", FAST2SMS_API_KEY)
    api_key = raw_key.strip().strip("'").strip('"') if raw_key else ""
    clean_digits = "".join(filter(str.isdigit, phone))
    phone_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits


    # 1. Fast2SMS (Preferred Indian Gateway - Fast & No DLT hurdle on OTP route)
    if api_key and not api_key.startswith("your_"):
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "route": "otp",
                "variables_values": otp,
                "numbers": phone_10
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                data = resp.json()
                if data.get("return") is True:
                    print(f"[SMS Success] OTP delivered via Fast2SMS to +91 {phone_10}")
                    return True
                else:
                    print(f"[Fast2SMS Notice] {data.get('message')}")
        except Exception as e:
            logger.warning(f"[Fast2SMS Request Error] {e}")

    # 2. Twilio Gateway
    tw_sid = os.getenv("TWILIO_ACCOUNT_SID", TWILIO_ACCOUNT_SID)
    tw_token = os.getenv("TWILIO_AUTH_TOKEN", TWILIO_AUTH_TOKEN)
    tw_from = os.getenv("TWILIO_PHONE_NUMBER", TWILIO_PHONE_NUMBER)

    if tw_sid and tw_token and tw_from:
        try:
            target_number = f"+91{phone_10}"
            url = f"https://api.twilio.com/2010-04-01/Accounts/{tw_sid}/Messages.json"
            form_data = {
                "From": tw_from,
                "To": target_number,
                "Body": f"🚗 ParkSmart: Your login OTP is {otp}. Valid for 5 minutes. Do not share."
            }
            async with httpx.AsyncClient(auth=(tw_sid, tw_token), timeout=8.0) as client:
                resp = await client.post(url, data=form_data)
                if resp.status_code in [200, 201]:
                    print(f"[SMS Success] OTP delivered via Twilio to {target_number}")
                    return True
                else:
                    logger.warning(f"[Twilio Response Notice] {resp.text}")
        except Exception as e:
            logger.warning(f"[Twilio Request Error] {e}")

    # Development Sandbox Fallback
    print(f"[SMS Dev Simulator] Sent OTP {otp} to {phone_10}")
    return False
