from django.contrib import admin

from .models import BookingRequest, BookingOffer, Notification, Payment


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer",
        "display_services",
        "booking_type",
        "booking_date",
        "booking_time",
        "total_amount",
        "status",
        "payment_method",
        "payment_status",
        "accepted_barber",
        "created_at",
    )

    list_filter = (
        "status",
        "payment_status",
        "payment_method",
        "booking_type",
        "booking_date",
        "created_at",
    )

    search_fields = (
        "customer__username",
        "customer__phone",
        "service__name",
        "services__name",
        "accepted_barber__shop_name",
        "razorpay_order_id",
        "razorpay_payment_id",
    )

    filter_horizontal = ("services",)

    readonly_fields = (
        "created_at",
        "updated_at",
        "accepted_at",
        "completed_at",
    )

    @admin.display(description="Services")
    def display_services(self, obj):
        return obj.get_services_display()


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "amount",
        "currency",
        "status",
        "razorpay_order_id",
        "razorpay_payment_id",
        "created_at",
    )

    list_filter = (
        "status",
        "currency",
        "created_at",
    )

    search_fields = (
        "razorpay_order_id",
        "razorpay_payment_id",
        "booking__id",
        "booking__customer__username",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(BookingOffer)
class BookingOfferAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "barber",
        "status",
        "created_at",
        "responded_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "barber__shop_name",
        "barber__owner_name",
        "booking__customer__username",
        "booking__customer__phone",
    )

    readonly_fields = (
        "created_at",
        "responded_at",
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "notification_type",
        "title",
        "is_read",
        "booking",
        "created_at",
    )

    list_filter = (
        "notification_type",
        "is_read",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "title",
        "message",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )