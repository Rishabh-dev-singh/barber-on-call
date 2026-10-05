import re
from django.db import models
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from .captcha import verify_captcha


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    role = serializers.CharField(required=False, write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = getattr(user, "role", "customer")
        token["username"] = user.username
        token["name"] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        request = self.context.get("request")
        requested_role = None
        if request and hasattr(request, "data"):
            requested_role = request.data.get("role")
        if not requested_role:
            requested_role = attrs.pop("role", None)

        # Allow login via phone number or username
        username = attrs.get("username", "")
        if username:
            cleaned_input = str(username).strip()
            exact_user = User.objects.filter(username=cleaned_input).first()

            # If input directly matches a username having the requested role, use it
            if exact_user and (not requested_role or exact_user.role == requested_role):
                attrs["username"] = exact_user.username
            else:
                # Attempt phone resolution matching requested role
                digits_only = re.sub(r"\D", "", cleaned_input)
                ten_digit = digits_only[-10:] if len(digits_only) >= 10 else digits_only

                phone_qs = User.objects.filter(
                    models.Q(phone=cleaned_input)
                    | models.Q(phone=ten_digit)
                    | models.Q(phone=f"+91{ten_digit}")
                )
                phone_users = list(phone_qs)
                if requested_role:
                    candidates = [u for u in phone_users if u.role == requested_role]
                else:
                    candidates = phone_users

                matched_user = None
                password = attrs.get("password")
                if password:
                    # 1. First check matching password for requested role
                    for u in candidates:
                        if u.check_password(password):
                            matched_user = u
                            break
                    # 2. If no candidate matched, check other accounts with the same phone
                    if not matched_user:
                        for u in phone_users:
                            if u.check_password(password):
                                matched_user = u
                                break

                # Fallback to candidate or phone_user so super().validate gets a valid username
                if not matched_user:
                    if candidates:
                        matched_user = candidates[0]
                    elif phone_users:
                        matched_user = phone_users[0]

                if matched_user:
                    attrs["username"] = matched_user.username

        try:
            data = super().validate(attrs)
        except serializers.ValidationError:
            # Check if this mobile number belongs to a pending BarberApplication
            if requested_role == "barber":
                try:
                    from barbers.models import BarberApplication
                    raw_user = attrs.get("username", "")
                    digits = re.sub(r"\D", "", str(raw_user))[-10:]
                    if digits and BarberApplication.objects.filter(mobile=digits, status="pending").exists():
                        raise serializers.ValidationError({
                            "detail": "Your barber application is currently under review by our onboarding team. You will be able to log in once approved."
                        })
                except Exception:
                    pass
            raise

        if not requested_role:
            raise serializers.ValidationError(
                {"detail": "Role parameter is required ('customer' or 'barber') for secure authentication."}
            )

        if requested_role not in ["customer", "barber", "admin"]:
            raise serializers.ValidationError(
                {"detail": f"Invalid role '{requested_role}'. Must be 'customer' or 'barber'."}
            )

        user_role = getattr(self.user, "role", "customer")
        if requested_role != user_role and user_role != "admin":
            if requested_role == "barber":
                raise serializers.ValidationError(
                    {"detail": "Access Denied: This account is registered as a Customer. You cannot log into the Barber Portal with a Customer account."}
                )
            elif requested_role == "customer":
                raise serializers.ValidationError(
                    {"detail": "Access Denied: This account is registered as a Barber. You cannot log into the Customer App with a Barber account."}
                )
            else:
                raise serializers.ValidationError(
                    {"detail": f"Access Denied: Unauthorized role '{requested_role}' for this account."}
                )

        data["user_id"] = self.user.id
        data["role"] = user_role
        data["username"] = self.user.username
        data["name"] = self.user.get_full_name() or self.user.username
        data["phone"] = self.user.phone or ""
        data["email"] = self.user.email or ""

        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    name = serializers.CharField(
        write_only=True,
        required=True
    )

    phone = serializers.CharField(
        required=True,
        max_length=15
    )

    captcha_token = serializers.CharField(
        write_only=True,
        required=True
    )

    captcha_answer = serializers.CharField(
        write_only=True,
        required=True
    )

    class Meta:
        model = User
        fields = [
            "name",
            "username",
            "email",
            "password",
            "phone",
            "role",
            "captcha_token",
            "captcha_answer",
        ]

    def validate_phone(self, value):
        cleaned = re.sub(r"[\s\-\+]", "", str(value).strip())
        if not re.match(r"^\d{10,15}$", cleaned):
            raise serializers.ValidationError(
                "Please enter a valid 10-digit mobile number."
            )
        if User.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError(
                "This mobile number is already registered. Please log in."
            )
        return cleaned

    def validate_password(self, value):
        try:
            django_validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(" ".join(e.messages))
        return value

    def validate(self, attrs):
        token = attrs.pop("captcha_token", None)
        answer = attrs.pop("captcha_answer", None)

        is_valid, error_msg = verify_captcha(token, answer)
        if not is_valid:
            raise serializers.ValidationError({"captcha_answer": error_msg})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        name = validated_data.pop("name").strip()

        name_parts = name.split(" ", 1)

        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Public self-registration is strictly for customers.
        # Barber accounts can only be approved by admin via BarberApplication.
        validated_data["role"] = "customer"

        user = User.objects.create_user(
            password=password,
            first_name=first_name,
            last_name=last_name,
            **validated_data
        )

        return user