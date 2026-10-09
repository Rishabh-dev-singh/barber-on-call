from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

import random
import re
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from .sms import send_fast2sms_otp
from .models import PhoneOTP, User
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer
from .captcha import generate_captcha
from .permissions import IsCustomerUser


class CaptchaGenerateView(APIView):
    """
    Generates an arithmetic challenge and signed token for bot prevention.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        question, token = generate_captcha()
        return Response({
            "question": question,
            "captcha_token": token,
        })


class SendRegistrationOTPView(APIView):
    """
    Sends a 4-digit SMS OTP via Fast2SMS to verify customer's phone number during registration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        raw_phone = request.data.get("phone", "")
        cleaned_phone = re.sub(r"\D", "", str(raw_phone))[-10:]

        if len(cleaned_phone) != 10:
            return Response(
                {"detail": "Please enter a valid 10-digit mobile number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already registered
        if User.objects.filter(phone=cleaned_phone).exists():
            return Response(
                {"detail": "This mobile number is already registered. Please log in directly."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Rate limiting: 30 seconds cooldown between SMS requests
        now = timezone.now()
        recent_otp = PhoneOTP.objects.filter(
            phone=cleaned_phone,
            created_at__gte=now - timedelta(seconds=30)
        ).first()

        if recent_otp:
            return Response(
                {"detail": "An OTP was just sent. Please wait 30 seconds before requesting another."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        otp = f"{random.randint(1000, 9999)}"

        PhoneOTP.objects.create(
            phone=cleaned_phone,
            otp=otp,
        )

        success, msg = send_fast2sms_otp(cleaned_phone, otp)

        if not success:
            return Response(
                {"detail": f"Failed to send SMS OTP: {msg}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "message": f"OTP sent successfully to +91 {cleaned_phone}.",
            "phone": cleaned_phone,
        })


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["username"] = user.username
        refresh["name"] = user.get_full_name() or user.username

        return Response(
            {
                "success": True,
                "message": "Registration successful!",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.get_full_name() or user.username,
                    "phone": user.phone,
                    "role": user.role,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerProfileView(APIView):
    permission_classes = [IsAuthenticated, IsCustomerUser]

    def get(self, request):
        user = request.user

        if user.role != "customer":
            return Response(
                {"detail": "Only customers can access this profile."},
                status=403
            )

        full_name = f"{user.first_name} {user.last_name}".strip()

        profile_picture = None

        if user.profile_picture:
            profile_picture = request.build_absolute_uri(
                user.profile_picture.url
            )

        return Response({
            "id": user.id,
            "name": full_name or user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "profile_picture": profile_picture,
        })

    def patch(self, request):
        user = request.user

        if user.role != "customer":
            return Response(
                {"detail": "Only customers can update this profile."},
                status=403
            )

        # Name
        if "name" in request.data:
            name = str(request.data.get("name", "")).strip()

            if not name:
                return Response(
                    {"detail": "Name cannot be empty."},
                    status=400
                )

            name_parts = name.split(" ", 1)

            user.first_name = name_parts[0]
            user.last_name = (
                name_parts[1]
                if len(name_parts) > 1
                else ""
            )

        # Email
        if "email" in request.data:
            user.email = str(
                request.data.get("email", "")
            ).strip()

        # Phone
        if "phone" in request.data:
            user.phone = str(
                request.data.get("phone", "")
            ).strip()

        # Profile picture
        if "profile_picture" in request.FILES:
            profile_picture = request.FILES["profile_picture"]

            # Maximum 2 MB
            max_size = 2 * 1024 * 1024

            if profile_picture.size > max_size:
                return Response(
                    {
                        "detail": "Profile picture must be 2 MB or smaller."
                    },
                    status=400
                )

            # Allowed image types
            allowed_types = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ]

            if profile_picture.content_type not in allowed_types:
                return Response(
                    {
                        "detail": "Only JPG, PNG and WebP images are allowed."
                    },
                    status=400
                )

            user.profile_picture = profile_picture

        user.save()

        full_name = f"{user.first_name} {user.last_name}".strip()

        profile_picture_url = None

        if user.profile_picture:
            profile_picture_url = request.build_absolute_uri(
                user.profile_picture.url
            )

        return Response({
            "message": "Profile updated successfully.",
            "profile": {
                "id": user.id,
                "name": full_name or user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "profile_picture": profile_picture_url,
            }
        })


class CustomerChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsCustomerUser]

    def post(self, request):
        user = request.user

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        # Required fields
        if not current_password:
            return Response(
                {"detail": "Current password is required."},
                status=400
            )

        if not new_password:
            return Response(
                {"detail": "New password is required."},
                status=400
            )

        if not confirm_password:
            return Response(
                {"detail": "Please confirm your new password."},
                status=400
            )

        # Check current password
        if not user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=400
            )

        # Validate password strength
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response(
                {"detail": " ".join(e.messages)},
                status=400
            )

        # Confirm new password
        if new_password != confirm_password:
            return Response(
                {"detail": "New passwords do not match."},
                status=400
            )

        # Don't allow same password
        if current_password == new_password:
            return Response(
                {
                    "detail": (
                        "New password must be different from "
                        "current password."
                    )
                },
                status=400
            )

        # Save new password securely
        user.set_password(new_password)

        user.must_change_password = False

        user.save(
            update_fields=[
                "password",
                "must_change_password",
            ]
        )

        return Response(
            {
                "message": "Password changed successfully."
            },
            status=200
        )