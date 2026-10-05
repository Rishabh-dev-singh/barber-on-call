from django.urls import path

from .views import (
    BarberListView,
    BarberDetailView,
    BarberServiceListCreateView,
    BarberServiceDetailView,
    BarberServiceCreateView,
    BarberProfileUpdateView,
    BarberApplicationCreateView,
    BarberScheduleView,
    BarberPublicScheduleView,
    BarberBookedSlotsView,
    BarberReviewListCreateView,
    BarberChangePasswordView,
)


urlpatterns = [
    path(
        "change-password/",
        BarberChangePasswordView.as_view(),
        name="barber-change-password"
    ),
    path(
        "schedule/",
        BarberScheduleView.as_view(),
        name="barber-schedule"
    ),
    path(
        "<int:barber_id>/schedule/",
        BarberPublicScheduleView.as_view(),
        name="barber-public-schedule"
    ),
    path(
        "<int:barber_id>/booked-slots/",
        BarberBookedSlotsView.as_view(),
        name="barber-booked-slots"
    ),
    path(
        "<int:barber_id>/reviews/",
        BarberReviewListCreateView.as_view(),
        name="barber-reviews"
    ),
    path(
        "profile/",
        BarberProfileUpdateView.as_view(),
        name="barber-profile"
    ),

    path(
        "list/",
        BarberListView.as_view(),
        name="barber-list"
    ),

    path(
        "services/",
        BarberServiceListCreateView.as_view(),
        name="barber-services"
    ),

    path(
        "services/<int:pk>/",
        BarberServiceDetailView.as_view(),
        name="barber-service-detail"
    ),

    path(
        "services/create/",
        BarberServiceCreateView.as_view(),
        name="service-create"
    ),

    path(
        "apply/",
        BarberApplicationCreateView.as_view(),
        name="barber-apply"
    ),

    path(
        "<int:pk>/",
        BarberDetailView.as_view(),
        name="barber-detail"
    ),
]