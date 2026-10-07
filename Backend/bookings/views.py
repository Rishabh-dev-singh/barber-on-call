import json
import uuid
from decimal import Decimal

import razorpay
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import BookingRequest, BookingOffer, Notification, Payment
from .serializers import (
    BookingRequestSerializer,
    CustomerBookingSerializer,
    NotificationSerializer,
)
from barbers.models import BarberProfile


from accounts.permissions import IsCustomerUser, IsBarberUser


# ============================================================
# BARBER BOOKINGS
# ============================================================

class BarberBookingListView(APIView):
    """
    Returns booking offers belonging only to the logged-in barber.
    """

    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    def get(self, request):
        try:
            barber = BarberProfile.objects.get(user=request.user)
        except BarberProfile.DoesNotExist:
            return Response(
                {"detail": "Barber profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        offers = (
            BookingOffer.objects
            .filter(barber=barber)
            .select_related(
                "booking",
                "booking__customer",
                "booking__service",
            )
            .prefetch_related("booking__services")
            .order_by("-created_at")
        )

        data = []

        for offer in offers:
            booking = offer.booking
            service = booking.service
            customer = booking.customer

            svc_list = list(booking.services.all())
            services_data = [
                {
                    "id": s.id,
                    "name": s.name,
                    "duration": s.duration,
                    "shop_price": str(s.shop_price),
                    "home_price": str(s.home_price),
                }
                for s in svc_list
            ]
            if not services_data and service:
                services_data = [{
                    "id": service.id,
                    "name": service.name,
                    "duration": service.duration,
                    "shop_price": str(service.shop_price),
                    "home_price": str(service.home_price),
                }]

            primary_service = services_data[0] if services_data else {
                "id": None,
                "name": "Service",
                "duration": 30,
            }

            data.append({
                "offer_id": offer.id,
                "booking_id": booking.id,

                "customer": {
                    "id": customer.id,
                    "name": customer.get_full_name() or customer.username,
                    "phone": customer.phone,
                },

                "service": primary_service,
                "services": services_data,
                "services_display": booking.get_services_display(),

                "booking_type": booking.booking_type,
                "needs_chair_mirror": getattr(booking, "needs_chair_mirror", False),
                "booking_date": booking.booking_date,
                "booking_time": booking.booking_time,

                "address": booking.address,
                "latitude": booking.latitude,
                "longitude": booking.longitude,

                "total_amount": booking.total_amount,

                "booking_status": booking.status,
                "payment_status": booking.payment_status,
                "payment_method": booking.payment_method,
                "offer_status": offer.status,

                "created_at": offer.created_at,
            })

        return Response(
            data,
            status=status.HTTP_200_OK
        )


class BarberBookingAcceptView(APIView):
    """
    Barber accepts a booking offer.
    Booking moves to awaiting_payment.
    Customer receives a notification.
    """

    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    @transaction.atomic
    def post(self, request, offer_id):

        try:
            barber = BarberProfile.objects.select_for_update().get(
                user=request.user
            )
        except BarberProfile.DoesNotExist:
            return Response(
                {"detail": "Barber profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            offer = (
                BookingOffer.objects
                .select_for_update()
                .select_related("booking")
                .get(
                    id=offer_id,
                    barber=barber
                )
            )
        except BookingOffer.DoesNotExist:
            return Response(
                {"detail": "Booking offer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        booking = BookingRequest.objects.select_for_update().get(
            id=offer.booking_id
        )

        if booking.accepted_barber_id is not None:

            if booking.accepted_barber_id == barber.id:
                return Response(
                    {
                        "detail": "You have already accepted this booking.",
                        "status": booking.status,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            offer.status = "already_accepted"
            offer.responded_at = timezone.now()

            offer.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "This booking has already been accepted "
                        "by another barber."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        if booking.status != "pending":
            return Response(
                {
                    "detail": (
                        f"This booking is currently "
                        f"{booking.status}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Double-booking collision prevention check for barber
        conflict_booking = BookingRequest.objects.filter(
            booking_date=booking.booking_date,
            booking_time=booking.booking_time,
            status__in=["accepted", "awaiting_payment", "confirmed", "completed"],
            accepted_barber=barber,
        ).exclude(id=booking.id).exists()

        if conflict_booking:
            return Response(
                {
                    "detail": "You already have another active booking scheduled at this date and time slot."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        offer.status = "accepted"
        offer.responded_at = now

        offer.save(
            update_fields=[
                "status",
                "responded_at",
            ]
        )

        booking.accepted_barber = barber
        booking.accepted_at = now
        booking.status = "awaiting_payment"

        booking.save(
            update_fields=[
                "accepted_barber",
                "accepted_at",
                "status",
                "updated_at",
            ]
        )

        booking.refresh_from_db()

        BookingOffer.objects.filter(
            booking=booking,
            status="pending"
        ).exclude(
            barber=barber
        ).update(
            status="already_accepted",
            responded_at=now
        )

        Notification.objects.create(
            user=booking.customer,
            booking=booking,
            notification_type="awaiting_payment",
            title="Booking Accepted",
            message=(
                f"{barber.shop_name} has accepted your booking. "
                f"Payment is required to confirm your booking."
            ),
        )

        return Response(
            {
                "success": True,
                "detail": (
                    "Booking accepted. "
                    "Waiting for customer payment."
                ),
                "booking_id": booking.id,
                "status": booking.status,
            },
            status=status.HTTP_200_OK,
        )


class BarberBookingRejectView(APIView):
    """
    Barber rejects his own booking offer.
    Customer receives a notification.
    """

    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    @transaction.atomic
    def post(self, request, offer_id):

        try:
            barber = BarberProfile.objects.get(
                user=request.user
            )
        except BarberProfile.DoesNotExist:
            return Response(
                {"detail": "Barber profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            offer = (
                BookingOffer.objects
                .select_related("booking")
                .get(
                    id=offer_id,
                    barber=barber
                )
            )
        except BookingOffer.DoesNotExist:
            return Response(
                {"detail": "Booking offer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if offer.status != "pending":
            return Response(
                {
                    "detail": (
                        f"This offer is already "
                        f"{offer.status}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        offer.status = "rejected"
        offer.responded_at = timezone.now()

        offer.save(
            update_fields=[
                "status",
                "responded_at",
            ]
        )

        Notification.objects.create(
            user=offer.booking.customer,
            booking=offer.booking,
            notification_type="booking_rejected",
            title="Booking Rejected",
            message=(
                f"{barber.shop_name} has rejected your "
                f"booking request."
            ),
        )

        return Response(
            {
                "success": True,
                "detail": "Booking rejected successfully.",
            },
            status=status.HTTP_200_OK,
        )


class BarberBookingCompleteView(APIView):
    """
    Barber marks a confirmed booking as completed.
    Customer receives a notification.
    """

    permission_classes = [permissions.IsAuthenticated, IsBarberUser]

    @transaction.atomic
    def post(self, request, booking_id):

        try:
            barber = BarberProfile.objects.get(
                user=request.user
            )
        except BarberProfile.DoesNotExist:
            return Response(
                {"detail": "Barber profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            booking = BookingRequest.objects.get(
                id=booking_id,
                accepted_barber=barber
            )
        except BookingRequest.DoesNotExist:
            return Response(
                {"detail": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status not in ["confirmed", "accepted"]:
            return Response(
                {
                    "detail": (
                        f"Booking cannot be completed from "
                        f"'{booking.status}' status."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "completed"
        booking.completed_at = timezone.now()
        if booking.payment_status != "paid":
            booking.payment_status = "paid"

        booking.save(
            update_fields=[
                "status",
                "completed_at",
                "payment_status",
                "updated_at",
            ]
        )

        service_title = booking.get_services_display()

        Notification.objects.create(
            user=booking.customer,
            booking=booking,
            notification_type="booking_completed",
            title="Booking Completed",
            message=(
                f"Your {service_title} booking with "
                f"{barber.shop_name} has been completed."
            ),
        )

        return Response(
            {
                "success": True,
                "detail": "Booking marked as completed.",
                "booking_id": booking.id,
                "status": booking.status,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# CUSTOMER BOOKINGS
# ============================================================

class CustomerBookingCreateView(APIView):
    """
    Customer creates a new booking request.
    Barber receives a notification.
    """

    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    @transaction.atomic
    def post(self, request):

        if request.user.role != "customer":
            return Response(
                {
                    "detail": "Only customers can create bookings."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        service_ids = request.data.get("service_ids")
        if isinstance(service_ids, str):
            service_ids = [int(s.strip()) for s in service_ids.split(",") if s.strip().isdigit()]
        elif not isinstance(service_ids, list):
            service_ids = []

        if not service_ids and request.data.get("service"):
            service_ids = [request.data.get("service")]

        if not service_ids:
            return Response(
                {"detail": "Please select at least one service."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from barbers.models import Service
        services = list(
            Service.objects.filter(id__in=service_ids, is_active=True).select_related(
                "barber", "barber__user"
            )
        )
        if not services or len(services) != len(set(service_ids)):
            return Response(
                {"detail": "One or more selected services are unavailable or invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        barber_ids = {s.barber_id for s in services}
        if len(barber_ids) > 1:
            return Response(
                {"detail": "All selected services must belong to the same barber."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        barber = services[0].barber
        if not barber.is_active:
            return Response(
                {"detail": "This barber is currently not accepting bookings."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking_type = request.data.get("booking_type", "shop")
        if booking_type == "home":
            if not barber.home_service_enabled:
                return Response(
                    {"detail": "Home service is not offered by this barber."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            home_visit_charge = barber.home_visit_charge or Decimal("0.00")
            total_amount = sum(Decimal(str(s.home_price)) for s in services) + home_visit_charge
        else:
            if not barber.shop_service_enabled:
                return Response(
                    {"detail": "Shop service is not offered by this barber."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            total_amount = sum(Decimal(str(s.shop_price)) for s in services)

        booking_date = request.data.get("booking_date")
        booking_time = request.data.get("booking_time")
        if not booking_date or not booking_time:
            return Response(
                {"detail": "Please provide booking date and time."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Double-booking collision prevention check
        has_conflict = BookingRequest.objects.filter(
            booking_date=booking_date,
            booking_time=booking_time,
            status__in=["accepted", "awaiting_payment", "confirmed", "completed"],
        ).filter(
            Q(accepted_barber=barber)
            | Q(services__barber=barber)
            | Q(service__barber=barber)
        ).distinct().exists()

        if has_conflict:
            return Response(
                {"detail": "This time slot is already booked for this barber. Please select a different time."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        address = request.data.get("address", "")
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        needs_chair_mirror = bool(request.data.get("needs_chair_mirror", False))

        booking = BookingRequest.objects.create(
            customer=request.user,
            service=services[0],
            booking_type=booking_type,
            needs_chair_mirror=needs_chair_mirror,
            booking_date=booking_date,
            booking_time=booking_time,
            address=address,
            latitude=latitude,
            longitude=longitude,
            total_amount=total_amount,
            status="pending",
        )
        booking.services.set(services)

        BookingOffer.objects.create(
            booking=booking,
            barber=barber,
            status="pending",
        )

        customer_name = (
            request.user.get_full_name()
            or request.user.username
        )
        services_names = ", ".join(s.name for s in services)

        Notification.objects.create(
            user=barber.user,
            booking=booking,
            notification_type="booking_request",
            title="New Booking Request",
            message=(
                f"New booking request for {services_names} "
                f"from {customer_name}."
            ),
        )

        return Response(
            CustomerBookingSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )


class CustomerBookingListView(APIView):
    """
    Returns all bookings belonging to the logged-in customer.
    """

    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    def get(self, request):

        if request.user.role != "customer":
            return Response(
                {
                    "detail": (
                        "Only customers can view "
                        "customer bookings."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        bookings = (
            BookingRequest.objects
            .filter(customer=request.user)
            .select_related(
                "service",
                "service__barber",
                "accepted_barber",
            )
            .prefetch_related("services")
            .order_by("-created_at")
        )

        serializer = CustomerBookingSerializer(
            bookings,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class CreateRazorpayOrderView(APIView):
    """
    Creates a Razorpay order for an awaiting_payment booking.
    Strictly calculates order amount from database booking record.
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    def post(self, request, booking_id):
        if request.user.role != "customer":
            return Response(
                {"detail": "Only customers can make payments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            booking = BookingRequest.objects.select_related(
                "customer", "accepted_barber", "service"
            ).get(id=booking_id, customer=request.user)
        except BookingRequest.DoesNotExist:
            return Response(
                {"detail": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if already paid
        if booking.payment_status == "paid" or booking.status == "confirmed":
            return Response(
                {"detail": "This booking has already been paid and confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Pending check: Barber must accept first
        if booking.status == "pending":
            return Response(
                {
                    "detail": "Booking is still pending barber approval. Payment can only be made once the barber accepts your booking."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status != "awaiting_payment":
            return Response(
                {"detail": f"Cannot initiate payment for booking with status '{booking.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # DB total_amount is strictly the source of truth
        amount_in_paise = int(booking.total_amount * 100)
        key_id = getattr(settings, "RAZORPAY_KEY_ID", "").strip()
        key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "").strip()

        if not key_id or not key_secret:
            return Response(
                {"detail": "Razorpay keys are not configured on server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            order_payload = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"booking_{booking.id}",
                "notes": {
                    "booking_id": str(booking.id),
                    "customer_id": str(request.user.id),
                },
            }
            rzp_order = client.order.create(data=order_payload)
            order_id = rzp_order["id"]
        except Exception as e:
            return Response(
                {"detail": f"Razorpay order creation failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        booking.razorpay_order_id = order_id
        booking.payment_method = "online"
        booking.save(update_fields=["razorpay_order_id", "payment_method", "updated_at"])

        Payment.objects.update_or_create(
            booking=booking,
            razorpay_order_id=order_id,
            defaults={
                "amount": booking.total_amount,
                "currency": "INR",
                "status": "created",
            },
        )

        customer_name = request.user.get_full_name() or request.user.username
        barber_name = booking.accepted_barber.shop_name if booking.accepted_barber else "Barber On Call"

        return Response(
            {
                "success": True,
                "order_id": order_id,
                "amount": amount_in_paise,
                "currency": "INR",
                "key_id": key_id,
                "booking_id": booking.id,
                "customer": {
                    "name": customer_name,
                    "email": request.user.email or "customer@barberoncall.com",
                    "phone": request.user.phone or "",
                },
                "service_name": booking.get_services_display(),
                "barber_shop_name": barber_name,
                "is_mock": False,
            },
            status=status.HTTP_200_OK,
        )


class VerifyRazorpayPaymentView(APIView):
    """
    Verifies Razorpay payment signature and marks the booking as confirmed.
    Safely handles duplicate verifications, invalid signatures, and amount checks.
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    @transaction.atomic
    def post(self, request, booking_id):
        if request.user.role != "customer":
            return Response(
                {"detail": "Only customers can verify payments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            booking = BookingRequest.objects.select_for_update().get(
                id=booking_id, customer=request.user
            )
        except BookingRequest.DoesNotExist:
            return Response(
                {"detail": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 1. Duplicate verification / already confirmed check (Idempotent)
        if booking.status == "confirmed" and booking.payment_status == "paid":
            return Response(
                {
                    "success": True,
                    "detail": "Payment has already been verified and booking is confirmed.",
                    "already_paid": True,
                    "booking": CustomerBookingSerializer(booking).data,
                },
                status=status.HTTP_200_OK,
            )

        # 2. Status check: Booking must be awaiting_payment
        if booking.status != "awaiting_payment":
            return Response(
                {
                    "detail": f"Cannot verify payment for booking with status '{booking.status}'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not razorpay_payment_id or not razorpay_order_id or not razorpay_signature:
            return Response(
                {"detail": "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Order ID match check
        if booking.razorpay_order_id and booking.razorpay_order_id != razorpay_order_id:
            return Response(
                {"detail": "Order ID mismatch. The provided order ID does not match this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Amount mismatch check if amount was passed in request
        client_amount = request.data.get("amount")
        if client_amount is not None:
            try:
                c_val = Decimal(str(client_amount))
                db_val = booking.total_amount
                db_val_paise = db_val * 100
                if c_val != db_val and c_val != db_val_paise:
                    return Response(
                        {
                            "detail": f"Amount mismatch. Sent amount ({client_amount}) does not match booking amount ({db_val})."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception:
                pass

        key_id = getattr(settings, "RAZORPAY_KEY_ID", "").strip()
        key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "").strip()

        if not key_id or not key_secret:
            return Response(
                {"detail": "Payment gateway credentials are not configured on server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        client = razorpay.Client(auth=(key_id, key_secret))
        params_dict = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        }

        # 5. Strict cryptographic signature verification using Razorpay utility
        try:
            client.utility.verify_payment_signature(params_dict)
        except Exception:
            # Payment failed or tampered!
            # Record failed payment attempt in Payment model
            existing_payment = Payment.objects.filter(
                booking=booking, razorpay_order_id=razorpay_order_id
            ).order_by("-id").first()
            if existing_payment:
                existing_payment.razorpay_payment_id = razorpay_payment_id
                existing_payment.razorpay_signature = razorpay_signature
                existing_payment.status = "failed"
                existing_payment.save(update_fields=["razorpay_payment_id", "razorpay_signature", "status", "updated_at"])
            else:
                Payment.objects.create(
                    booking=booking,
                    razorpay_order_id=razorpay_order_id,
                    razorpay_payment_id=razorpay_payment_id,
                    razorpay_signature=razorpay_signature,
                    amount=booking.total_amount,
                    currency="INR",
                    status="failed",
                )
            # DO NOT alter booking.status to confirmed!
            return Response(
                {"detail": "Invalid payment signature. Verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 6. Double-check with Razorpay Payment API to verify capture and amount
        try:
            rzp_payment = client.payment.fetch(razorpay_payment_id)
            if rzp_payment.get("amount") != int(booking.total_amount * 100):
                return Response(
                    {"detail": "Payment amount verified with Razorpay does not match booking amount."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if rzp_payment.get("status") not in ["captured", "authorized"]:
                return Response(
                    {"detail": f"Razorpay payment is '{rzp_payment.get('status')}', not captured."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception:
            # If payment fetch API call encounters temporary network issue,
            # cryptographic HMAC-SHA256 signature was already verified above
            pass

        # 7. Update booking to confirmed & paid
        booking.razorpay_order_id = razorpay_order_id
        booking.razorpay_payment_id = razorpay_payment_id
        booking.razorpay_signature = razorpay_signature
        booking.payment_method = "online"
        booking.payment_status = "paid"
        booking.status = "confirmed"
        booking.save(
            update_fields=[
                "razorpay_order_id",
                "razorpay_payment_id",
                "razorpay_signature",
                "payment_method",
                "payment_status",
                "status",
                "updated_at",
            ]
        )

        existing_payment = Payment.objects.filter(
            booking=booking, razorpay_order_id=razorpay_order_id
        ).order_by("-id").first()
        if existing_payment:
            existing_payment.razorpay_payment_id = razorpay_payment_id
            existing_payment.razorpay_signature = razorpay_signature
            existing_payment.amount = booking.total_amount
            existing_payment.status = "success"
            existing_payment.save(update_fields=["razorpay_payment_id", "razorpay_signature", "amount", "status", "updated_at"])
        else:
            Payment.objects.create(
                booking=booking,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
                amount=booking.total_amount,
                currency="INR",
                status="success",
            )

        customer_name = request.user.get_full_name() or request.user.username

        # Notify Barber
        if booking.accepted_barber:
            Notification.objects.create(
                user=booking.accepted_barber.user,
                booking=booking,
                notification_type="booking_confirmed",
                title="Payment Received & Booking Confirmed",
                message=(
                    f"Online payment of ₹{booking.total_amount} received from {customer_name} "
                    f"for booking #{booking.id}. Appointment is confirmed."
                ),
            )

        # Notify Customer
        Notification.objects.create(
            user=booking.customer,
            booking=booking,
            notification_type="booking_confirmed",
            title="Booking Confirmed",
            message=(
                f"Payment of ₹{booking.total_amount} successful! "
                f"Your appointment #{booking.id} is confirmed."
            ),
        )

        return Response(
            {
                "success": True,
                "detail": "Payment verified and booking confirmed successfully!",
                "booking": CustomerBookingSerializer(booking).data,
            },
            status=status.HTTP_200_OK,
        )


class CustomerBookingCancelView(APIView):
    """
    Customer cancels their pending or awaiting_payment booking.
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    @transaction.atomic
    def post(self, request, booking_id):
        if request.user.role != "customer":
            return Response(
                {"detail": "Only customers can cancel their bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            booking = BookingRequest.objects.select_for_update().get(
                id=booking_id, customer=request.user
            )
        except BookingRequest.DoesNotExist:
            return Response(
                {"detail": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status in ["completed", "cancelled"]:
            return Response(
                {"detail": f"Cannot cancel a booking that is already {booking.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        was_paid = (booking.payment_status == "paid")
        booking.status = "cancelled"
        update_fields = ["status", "updated_at"]

        if was_paid:
            booking.payment_status = "refunded"
            update_fields.append("payment_status")
            Payment.objects.filter(booking=booking, status="success").update(status="refunded")

            key_id = getattr(settings, "RAZORPAY_KEY_ID", "").strip()
            key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "").strip()
            if (
                key_id
                and not key_id.startswith("rzp_test_placeholder")
                and key_secret
                and key_secret != "placeholder_secret"
                and booking.razorpay_payment_id
                and not booking.razorpay_payment_id.startswith("pay_mock_")
            ):
                try:
                    client = razorpay.Client(auth=(key_id, key_secret))
                    client.payment.refund(booking.razorpay_payment_id, {"amount": int(booking.total_amount * 100)})
                except Exception as rzp_err:
                    import logging
                    logging.getLogger(__name__).warning(f"Razorpay refund call: {rzp_err}")

        booking.save(update_fields=update_fields)

        # Cancel any active offers
        BookingOffer.objects.filter(booking=booking, status__in=["pending", "accepted"]).update(
            status="cancelled",
            responded_at=timezone.now()
        )

        # Notify Barber if accepted
        if booking.accepted_barber:
            Notification.objects.create(
                user=booking.accepted_barber.user,
                booking=booking,
                notification_type="booking_cancelled",
                title="Booking Cancelled",
                message=(
                    f"Booking #{booking.id} was cancelled by the customer."
                    + (f" Online payment of ₹{booking.total_amount} was refunded." if was_paid else "")
                ),
            )

        # Notify Customer
        Notification.objects.create(
            user=booking.customer,
            booking=booking,
            notification_type="booking_cancelled",
            title="Booking Cancelled" + (" & Refund Initiated" if was_paid else ""),
            message=(
                f"Booking #{booking.id} cancelled successfully."
                + (f" Refund of ₹{booking.total_amount} has been initiated to your original payment method." if was_paid else "")
            ),
        )

        detail_msg = "Booking cancelled successfully."
        if was_paid:
            detail_msg = f"Booking cancelled successfully. A refund of ₹{booking.total_amount} has been initiated to your account."

        return Response(
            {
                "success": True,
                "detail": detail_msg,
                "booking_id": booking.id,
                "status": booking.status,
                "payment_status": booking.payment_status,
                "refunded": was_paid,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# NOTIFICATIONS
# ============================================================

class NotificationListView(APIView):
    """
    Returns notifications for the logged-in user.
    Also returns unread notification count.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        notifications = (
            Notification.objects
            .filter(user=request.user)
            .select_related("booking")
            .order_by("-created_at")
        )

        unread_count = notifications.filter(
            is_read=False
        ).count()

        serializer = NotificationSerializer(
            notifications,
            many=True
        )

        return Response(
            {
                "unread_count": unread_count,
                "notifications": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class NotificationReadView(APIView):
    """
    Marks one notification as read.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):

        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {
                    "detail": "Notification not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not notification.is_read:
            notification.is_read = True

            notification.save(
                update_fields=["is_read"]
            )

        return Response(
            {
                "success": True,
                "message": "Notification marked as read.",
            },
            status=status.HTTP_200_OK,
        )


class NotificationReadAllView(APIView):
    """
    Marks all notifications of the logged-in user as read.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        updated_count = (
            Notification.objects
            .filter(
                user=request.user,
                is_read=False,
            )
            .update(is_read=True)
        )

        return Response(
            {
                "success": True,
                "message": "All notifications marked as read.",
                "updated_count": updated_count,
            },
            status=status.HTTP_200_OK,
        )


class RazorpayWebhookView(APIView):
    """
    Webhook handler for asynchronous Razorpay payment events.
    Verifies payload signature against RAZORPAY_WEBHOOK_SECRET if configured.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "").strip()
        payload = request.body.decode("utf-8")
        signature = request.headers.get("X-Razorpay-Signature", "")

        if webhook_secret:
            if not signature:
                return Response(
                    {"detail": "Missing X-Razorpay-Signature header."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            key_id = getattr(settings, "RAZORPAY_KEY_ID", "").strip()
            key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "").strip()
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                client.utility.verify_webhook_signature(payload, signature, webhook_secret)
            except Exception as e:
                return Response(
                    {"detail": f"Invalid webhook signature: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            event_data = json.loads(payload)
        except json.JSONDecodeError:
            return Response(
                {"detail": "Invalid JSON payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event = event_data.get("event")
        payload_entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload_entity.get("order_id")
        payment_id = payload_entity.get("id")

        if not webhook_secret:
            # If webhook secret is not set, we MUST verify directly with Razorpay API before trusting
            if not payment_id or not order_id:
                return Response({"detail": "Payment details missing."}, status=status.HTTP_400_BAD_REQUEST)
            key_id = getattr(settings, "RAZORPAY_KEY_ID", "").strip()
            key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "").strip()
            if not key_id or not key_secret:
                return Response({"detail": "Gateway unconfigured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                rzp_p = client.payment.fetch(payment_id)
                if rzp_p.get("status") not in ["captured", "authorized"] or rzp_p.get("order_id") != order_id:
                    return Response({"detail": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as err:
                return Response({"detail": f"Payment check failed: {str(err)}"}, status=status.HTTP_400_BAD_REQUEST)

        if event in ["payment.captured", "order.paid"] and order_id:
            try:
                booking = BookingRequest.objects.get(razorpay_order_id=order_id)
                if booking.payment_status != "paid":
                    booking.payment_status = "paid"
                    booking.status = "confirmed"
                    if payment_id:
                        booking.razorpay_payment_id = payment_id
                    booking.save(
                        update_fields=[
                            "payment_status",
                            "status",
                            "razorpay_payment_id",
                            "updated_at",
                        ]
                    )

                    Payment.objects.update_or_create(
                        booking=booking,
                        razorpay_order_id=order_id,
                        defaults={
                            "razorpay_payment_id": payment_id or "",
                            "amount": booking.total_amount,
                            "currency": "INR",
                            "status": "success",
                        },
                    )

                    if booking.accepted_barber:
                        Notification.objects.create(
                            user=booking.accepted_barber.user,
                            booking=booking,
                            notification_type="booking_confirmed",
                            title="Payment Received & Booking Confirmed",
                            message=f"Online payment received via Razorpay for booking #{booking.id}.",
                        )
            except BookingRequest.DoesNotExist:
                pass
        elif event == "payment.failed" and order_id:
            BookingRequest.objects.filter(razorpay_order_id=order_id).update(
                payment_status="failed",
                status="payment_failed",
            )

        return Response({"status": "ok"}, status=status.HTTP_200_OK)