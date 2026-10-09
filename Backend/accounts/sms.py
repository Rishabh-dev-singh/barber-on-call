import json
import logging
import re
import urllib.request
import urllib.error
from django.conf import settings

logger = logging.getLogger(__name__)


def send_fast2sms_otp(phone, otp):
    """
    Sends an OTP to an Indian mobile number via Fast2SMS gateway.
    Falls back gracefully between Quick OTP route ('otp') and Quick SMS route ('q').
    """
    digits = re.sub(r"\D", "", str(phone))[-10:]
    if len(digits) != 10:
        return False, "Invalid mobile number. Exactly 10 digits required."

    api_key = getattr(settings, "FAST2SMS_API_KEY", "").strip()
    if not api_key:
        logger.warning(f"[Fast2SMS MOCK] API Key missing. OTP for {digits} is {otp}")
        return True, "Mock OTP generated (Fast2SMS key not set)."

    # 1. Primary: Fast2SMS Quick OTP route (Delivery to both DND & Non-DND)
    otp_payload = json.dumps({
        "variables_values": str(otp),
        "route": "otp",
        "numbers": digits,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://www.fast2sms.com/dev/bulkV2",
        data=otp_payload,
        headers={
            "authorization": api_key,
            "Content-Type": "application/json",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            if res_body.get("return") is True:
                return True, "OTP sent successfully."
            return False, res_body.get("message", "Failed to send OTP.")
    except urllib.error.HTTPError as e:
        err_text = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_text)
            msg = err_json.get("message", err_text)
        except Exception:
            msg = err_text

        logger.warning(f"Fast2SMS OTP route notice: {msg}. Trying route 'q'...")

        # 2. Secondary Fallback: Fast2SMS Quick SMS route 'q'
        try:
            q_payload = json.dumps({
                "message": f"Your Barber On Call verification code is {otp}. Valid for 5 minutes.",
                "language": "english",
                "route": "q",
                "numbers": digits,
            }).encode("utf-8")

            q_req = urllib.request.Request(
                "https://www.fast2sms.com/dev/bulkV2",
                data=q_payload,
                headers={
                    "authorization": api_key,
                    "Content-Type": "application/json",
                },
                method="POST"
            )

            with urllib.request.urlopen(q_req, timeout=10) as q_response:
                q_body = json.loads(q_response.read().decode("utf-8"))
                if q_body.get("return") is True:
                    return True, "OTP sent successfully via Quick route."
        except Exception as q_err:
            logger.error(f"Fast2SMS fallback route 'q' error: {q_err}")

        return False, msg
    except Exception as e:
        logger.error(f"Fast2SMS network error: {e}")
        return False, "Failed to connect to SMS gateway. Please try again."

