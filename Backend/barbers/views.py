from django.db.models import Q
from rest_framework import generics, permissions, serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import BarberProfile, Service, BarberApplication, BarberSchedule, BarberReview, default_weekly_schedule
from .serializers import (
    BarberProfileSerializer,
    ServiceSerializer,
    BarberApplicationSerializer,
    BarberScheduleSerializer,
    BarberReviewSerializer,
)
from .permissions import IsBarberUser


class BarberListView(generics.ListAPIView):
    serializer_class = BarberProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = BarberProfile.objects.filter(is_active=True).prefetch_related("services")
        category = self.request.query_params.get("category")
        if category in ["standard", "premium"]:
            qs = qs.filter(category=category)

        chair_mirror = self.request.query_params.get("provides_chair_mirror")
        if chair_mirror is not None:
            if chair_mirror.lower() in ["true", "1"]:
                qs = qs.filter(provides_chair_mirror=True)
            elif chair_mirror.lower() in ["false", "0"]:
                qs = qs.filter(provides_chair_mirror=False)

        return qs.order_by("-id")


class BarberDetailView(generics.RetrieveAPIView):
    queryset = BarberProfile.objects.filter(is_active=True).prefetch_related("services")
    serializer_class = BarberProfileSerializer
    permission_classes = [permissions.AllowAny]


class BarberServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    def get_queryset(self):
        return Service.objects.filter(
            barber__user=self.request.user
        ).order_by("-id")

    def perform_create(self, serializer):
        try:
            profile = BarberProfile.objects.get(user=self.request.user)
            serializer.save(barber=profile)
        except BarberProfile.DoesNotExist:
            raise serializers.ValidationError(
                "Barber profile not found for this user."
            )


class BarberServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    def get_queryset(self):
        return Service.objects.filter(
            barber__user=self.request.user
        )


# Backward compatibility alias
BarberServiceCreateView = BarberServiceListCreateView


class BarberProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset = BarberProfile.objects.all()
    serializer_class = BarberProfileSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsBarberUser,
    ]
    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_object(self):
        profile, _ = BarberProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile


class BarberApplicationCreateView(generics.CreateAPIView):
    queryset = BarberApplication.objects.all()
    serializer_class = BarberApplicationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        serializer.save(status="pending")


class BarberScheduleView(APIView):
    """
    Allows the logged-in barber to view and update their weekly schedule and slot settings.
    """
    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    def get(self, request):
        try:
            profile = BarberProfile.objects.get(user=request.user)
        except BarberProfile.DoesNotExist:
            return Response(
                {"detail": "Barber profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        schedule, created = BarberSchedule.objects.get_or_create(
            barber=profile,
            defaults={"weekly_schedule": default_weekly_schedule()}
        )
        serializer = BarberScheduleSerializer(schedule)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        try:
            profile = BarberProfile.objects.get(user=request.user)
        except BarberProfile.DoesNotExist:
            return Response(
                {"detail": "Barber profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        schedule, _ = BarberSchedule.objects.get_or_create(
            barber=profile,
            defaults={"weekly_schedule": default_weekly_schedule()}
        )
        serializer = BarberScheduleSerializer(schedule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class BarberPublicScheduleView(APIView):
    """
    Allows customers to view a barber's schedule to compute dynamic time slots.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, barber_id):
        try:
            profile = BarberProfile.objects.get(id=barber_id, is_active=True)
        except BarberProfile.DoesNotExist:
            return Response(
                {"detail": "Barber not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        schedule, _ = BarberSchedule.objects.get_or_create(
            barber=profile,
            defaults={"weekly_schedule": default_weekly_schedule()}
        )
        serializer = BarberScheduleSerializer(schedule)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BarberBookedSlotsView(APIView):
    """
    Returns time slots that are already booked for a barber on a given date.
    Query param: ?date=YYYY-MM-DD
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, barber_id):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response(
                {"detail": "Please provide a date query parameter (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from bookings.models import BookingRequest

        booked_qs = BookingRequest.objects.filter(
            booking_date=date_str,
            status__in=["accepted", "awaiting_payment", "confirmed", "completed"],
        ).filter(
            Q(accepted_barber_id=barber_id)
            | Q(services__barber_id=barber_id)
            | Q(service__barber_id=barber_id)
        ).distinct()

        booked_slots = []
        for b in booked_qs:
            t = b.booking_time
            if t:
                time_24 = t.strftime("%H:%M")
                hour = t.hour
                minute = t.minute
                period = "PM" if hour >= 12 else "AM"
                hour_12 = 12 if hour % 12 == 0 else hour % 12
                time_12 = f"{hour_12:02d}:{minute:02d} {period}"

                booked_slots.append(time_24)
                booked_slots.append(time_12)

        return Response(
            {
                "date": date_str,
                "barber_id": barber_id,
                "booked_slots": sorted(list(set(booked_slots))),
            },
            status=status.HTTP_200_OK,
        )


class BarberReviewListCreateView(APIView):
    """
    GET: Returns all reviews for a barber.
    POST: Authenticated customer submits a rating and review for a barber.
    """
    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, barber_id):
        try:
            barber = BarberProfile.objects.get(id=barber_id)
        except BarberProfile.DoesNotExist:
            return Response({"detail": "Barber not found."}, status=status.HTTP_404_NOT_FOUND)

        reviews = BarberReview.objects.filter(barber=barber).select_related("customer")
        serializer = BarberReviewSerializer(reviews, many=True)
        return Response(
            {
                "barber_id": barber.id,
                "shop_name": barber.shop_name,
                "average_rating": barber.average_rating,
                "total_reviews": barber.total_reviews,
                "reviews": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, barber_id):
        if request.user.role != "customer":
            return Response({"detail": "Only customers can submit reviews."}, status=status.HTTP_403_FORBIDDEN)

        try:
            barber = BarberProfile.objects.get(id=barber_id)
        except BarberProfile.DoesNotExist:
            return Response({"detail": "Barber not found."}, status=status.HTTP_404_NOT_FOUND)

        booking_id = request.data.get("booking_id")
        rating = request.data.get("rating")
        comment = request.data.get("comment", "")

        if not booking_id:
            return Response(
                {"detail": "A valid completed booking ID is required to submit a verified review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({"detail": "Rating must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

        from bookings.models import BookingRequest
        try:
            booking = BookingRequest.objects.get(id=booking_id, customer=request.user)
        except BookingRequest.DoesNotExist:
            return Response(
                {"detail": "Booking not found or does not belong to your account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.accepted_barber_id != barber.id:
            return Response(
                {"detail": "This booking was not fulfilled by this barber."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status != "completed":
            return Response(
                {"detail": "You can only review a booking after the service has been marked completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if BarberReview.objects.filter(booking=booking).exists():
            return Response(
                {"detail": "You have already submitted a review for this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = BarberReview.objects.create(
            barber=barber,
            customer=request.user,
            booking=booking,
            rating=rating,
            comment=str(comment).strip(),
        )

        return Response(BarberReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class BarberChangePasswordView(APIView):
    """
    Dedicated password change endpoint restricted solely to verified barbers.
    """
    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    def post(self, request):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not current_password:
            return Response({"detail": "Current password is required."}, status=400)
        if not new_password:
            return Response({"detail": "New password is required."}, status=400)
        if not confirm_password:
            return Response({"detail": "Please confirm your new password."}, status=400)

        if not user.check_password(current_password):
            return Response({"detail": "Current password is incorrect."}, status=400)

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response({"detail": " ".join(e.messages)}, status=400)

        if new_password != confirm_password:
            return Response({"detail": "New passwords do not match."}, status=400)

        if current_password == new_password:
            return Response({"detail": "New password must be different from current password."}, status=400)

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        return Response({"message": "Password changed successfully."}, status=200)


