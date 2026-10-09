from django.urls import path

from .views import (
    RegisterView,
    CustomerProfileView,
    CustomerChangePasswordView,
    CustomLoginView,
    CaptchaGenerateView,
    SendRegistrationOTPView,
    ForgotPasswordSendOTPView,
    ForgotPasswordResetView,
)

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)


urlpatterns = [

    path(
        "send-otp/",
        SendRegistrationOTPView.as_view(),
        name="send-otp"
    ),

    path(
        "forgot-password/send-otp/",
        ForgotPasswordSendOTPView.as_view(),
        name="forgot-password-send-otp"
    ),

    path(
        "forgot-password/reset/",
        ForgotPasswordResetView.as_view(),
        name="forgot-password-reset"
    ),

    path(
        "captcha/",
        CaptchaGenerateView.as_view(),
        name="captcha"
    ),

    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    path(
        "login/",
        CustomLoginView.as_view(),
        name="login"
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    path(
        "profile/",
        CustomerProfileView.as_view(),
        name="customer-profile"
    ),

    path(
        "change-password/",
        CustomerChangePasswordView.as_view(),
        name="customer-change-password"
    ),

]