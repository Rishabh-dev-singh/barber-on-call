from rest_framework import serializers

from .models import BookingRequest, Notification
from barbers.serializers import ServiceSerializer


class BookingRequestSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    services_display = serializers.CharField(
        source="get_services_display",
        read_only=True,
    )

    class Meta:
        model = BookingRequest

        fields = [
            "id",
            "service",
            "services",
            "service_ids",
            "services_display",
            "booking_type",
            "needs_chair_mirror",
            "booking_date",
            "booking_time",
            "address",
            "latitude",
            "longitude",
            "total_amount",
            "status",
            "payment_method",
            "payment_status",
            "razorpay_order_id",
            "razorpay_payment_id",
            "accepted_barber",
            "created_at",
            "updated_at",
            "accepted_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "total_amount",
            "status",
            "payment_status",
            "razorpay_order_id",
            "razorpay_payment_id",
            "accepted_barber",
            "created_at",
            "updated_at",
            "accepted_at",
            "completed_at",
        ]
        extra_kwargs = {
            "service": {"required": False, "allow_null": True}
        }


class CustomerBookingSerializer(serializers.ModelSerializer):
    service = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    services_display = serializers.CharField(source="get_services_display", read_only=True)
    barber = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = BookingRequest

        fields = [
            "id",
            "service",
            "services",
            "services_display",
            "barber",
            "booking_type",
            "needs_chair_mirror",
            "booking_date",
            "booking_time",
            "address",
            "latitude",
            "longitude",
            "total_amount",
            "status",
            "payment_method",
            "payment_status",
            "razorpay_order_id",
            "razorpay_payment_id",
            "is_reviewed",
            "review",
            "completion_otp",
            "created_at",
            "accepted_at",
            "completed_at",
        ]

    def get_is_reviewed(self, obj):
        return hasattr(obj, "review") and obj.review is not None

    def get_review(self, obj):
        if hasattr(obj, "review") and obj.review is not None:
            return {
                "id": obj.review.id,
                "rating": obj.review.rating,
                "comment": obj.review.comment,
            }
        return None

    def get_service(self, obj):
        if obj.service:
            return {
                "id": obj.service.id,
                "name": obj.service.name,
                "duration": obj.service.duration,
            }
        first_svc = obj.services.first()
        if first_svc:
            return {
                "id": first_svc.id,
                "name": first_svc.name,
                "duration": first_svc.duration,
            }
        return None

    def get_services(self, obj):
        svc_list = obj.services.all()
        if svc_list.exists():
            return [
                {
                    "id": s.id,
                    "name": s.name,
                    "duration": s.duration,
                    "shop_price": str(s.shop_price),
                    "home_price": str(s.home_price),
                }
                for s in svc_list
            ]
        if obj.service:
            return [
                {
                    "id": obj.service.id,
                    "name": obj.service.name,
                    "duration": obj.service.duration,
                    "shop_price": str(obj.service.shop_price),
                    "home_price": str(obj.service.home_price),
                }
            ]
        return []

    def get_barber(self, obj):
        barber = obj.accepted_barber
        if not barber and obj.service:
            barber = obj.service.barber
        if not barber:
            first_svc = obj.services.first()
            if first_svc:
                barber = first_svc.barber

        if not barber:
            return None

        return {
            "id": barber.id,
            "shop_name": barber.shop_name,
            "owner_name": barber.owner_name,
            "city": barber.city,
            "mobile": barber.user.phone if barber.user else "",
        }


class NotificationSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(
        source="booking.id",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "booking_id",
            "notification_type",
            "title",
            "message",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "booking_id",
            "notification_type",
            "title",
            "message",
            "created_at",
        ]