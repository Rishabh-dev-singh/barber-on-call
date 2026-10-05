from django.urls import path

from .views import (
    BarberBookingListView,
    BarberBookingAcceptView,
    BarberBookingRejectView,
    BarberBookingCompleteView,
    CustomerBookingCreateView,
    CustomerBookingListView,
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView,
    CustomerBookingCancelView,
    RazorpayWebhookView,
    NotificationListView,
    NotificationReadView,
    NotificationReadAllView,
)


urlpatterns = [
    # =========================
    # BARBER BOOKING APIs
    # =========================

    path(
        "barber/",
        BarberBookingListView.as_view(),
        name="barber-bookings",
    ),

    path(
        "barber/<int:offer_id>/accept/",
        BarberBookingAcceptView.as_view(),
        name="barber-booking-accept",
    ),

    path(
        "barber/<int:offer_id>/reject/",
        BarberBookingRejectView.as_view(),
        name="barber-booking-reject",
    ),

    path(
        "barber/<int:booking_id>/complete/",
        BarberBookingCompleteView.as_view(),
        name="barber-booking-complete",
    ),


    # =========================
    # CUSTOMER BOOKING APIs
    # =========================

    path(
        "customer/create/",
        CustomerBookingCreateView.as_view(),
        name="customer-booking-create",
    ),

    path(
        "customer/",
        CustomerBookingListView.as_view(),
        name="customer-bookings",
    ),

    path(
        "customer/<int:booking_id>/create-razorpay-order/",
        CreateRazorpayOrderView.as_view(),
        name="customer-booking-create-razorpay-order",
    ),

    path(
        "customer/<int:booking_id>/verify-payment/",
        VerifyRazorpayPaymentView.as_view(),
        name="customer-booking-verify-payment",
    ),

    path(
        "customer/<int:booking_id>/cancel/",
        CustomerBookingCancelView.as_view(),
        name="customer-booking-cancel",
    ),

    path(
        "webhook/razorpay/",
        RazorpayWebhookView.as_view(),
        name="razorpay-webhook",
    ),


    # =========================
    # NOTIFICATION APIs
    # =========================

    path(
        "notifications/",
        NotificationListView.as_view(),
        name="notifications",
    ),

    path(
        "notifications/<int:notification_id>/read/",
        NotificationReadView.as_view(),
        name="notification-read",
    ),

    path(
        "notifications/read-all/",
        NotificationReadAllView.as_view(),
        name="notification-read-all",
    ),
]