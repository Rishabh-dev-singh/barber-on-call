import random
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

CAPTCHA_SALT = "barber_on_call_captcha_salt"
CAPTCHA_MAX_AGE = 300  # 5 minutes validity


def generate_captcha():
    """
    Generates an arithmetic captcha challenge and a cryptographically signed token.
    Returns: (question_string, signed_token)
    """
    op = random.choice(["+", "-", "*"])
    if op == "+":
        num1 = random.randint(1, 20)
        num2 = random.randint(1, 20)
        answer = num1 + num2
    elif op == "-":
        num1 = random.randint(10, 30)
        num2 = random.randint(1, num1)  # Ensure non-negative
        answer = num1 - num2
    else:  # multiplication
        num1 = random.randint(2, 9)
        num2 = random.randint(2, 9)
        answer = num1 * num2

    question = f"What is {num1} {op} {num2}?"
    signer = TimestampSigner(salt=CAPTCHA_SALT)
    token = signer.sign(str(answer))

    return question, token


def verify_captcha(token: str, user_answer: str):
    """
    Verifies the user's captcha answer against the signed token.
    Returns: (is_valid: bool, error_message: str | None)
    """
    if not token or not user_answer:
        return False, "Captcha answer and token are required."

    signer = TimestampSigner(salt=CAPTCHA_SALT)
    try:
        expected_answer = signer.unsign(token, max_age=CAPTCHA_MAX_AGE)
    except SignatureExpired:
        return False, "Captcha has expired. Please refresh and try again."
    except BadSignature:
        return False, "Invalid captcha token. Please refresh and try again."

    if str(user_answer).strip() != str(expected_answer).strip():
        return False, "Incorrect captcha answer. Please try again."

    return True, None

