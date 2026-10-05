from rest_framework import serializers
from .models import BarberProfile, Service, BarberApplication, BarberSchedule, BarberReview


class BarberReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = BarberReview
        fields = [
            "id",
            "barber",
            "customer",
            "customer_name",
            "booking",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "customer", "customer_name", "created_at"]

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "description",
            "duration",
            "shop_price",
            "home_price",
            "is_active",
        ]


class BarberScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BarberSchedule
        fields = [
            "id",
            "slot_duration",
            "break_enabled",
            "break_start",
            "break_end",
            "weekly_schedule",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class BarberProfileSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    schedule = BarberScheduleSerializer(read_only=True)
    rating = serializers.FloatField(source="average_rating", read_only=True)
    reviews_count = serializers.IntegerField(source="total_reviews", read_only=True)

    mobile = serializers.CharField(
        source="user.phone",
        required=False,
        allow_blank=True
    )

    email = serializers.EmailField(
        source="user.email",
        required=False,
        allow_blank=True
    )

    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = BarberProfile
        fields = [
            "id",
            "owner_name",
            "shop_name",
            "mobile",
            "email",
            "profile_picture",
            "address",
            "city",
            "pincode",
            "latitude",
            "longitude",
            "home_service_enabled",
            "shop_service_enabled",
            "home_service_radius",
            "home_visit_charge",
            "category",
            "provides_chair_mirror",
            "is_active",
            "services",
            "schedule",
            "rating",
            "reviews_count",
        ]

    def validate_profile_picture(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile picture must be under 5MB.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        if "phone" in user_data:
            instance.user.phone = user_data["phone"]

        if "email" in user_data:
            instance.user.email = user_data["email"]

        if user_data:
            instance.user.save(update_fields=["phone", "email"])

        return super().update(instance, validated_data)


class BarberApplicationSerializer(serializers.ModelSerializer):
    aadhaar_document = serializers.FileField(write_only=True, required=True)

    def validate_aadhaar_document(self, value):
        max_size = 5 * 1024 * 1024  # 5MB limit
        if value.size > max_size:
            raise serializers.ValidationError("Aadhaar document size must not exceed 5MB.")

        import os
        ext = os.path.splitext(value.name)[1].lower()
        allowed_extensions = [".pdf", ".jpg", ".jpeg", ".png"]
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format '{ext}'. Only PDF, JPG, JPEG, and PNG files are accepted."
            )
        return value

    def validate_mobile(self, value):
        cleaned = "".join(filter(str.isdigit, str(value)))
        if len(cleaned) != 10:
            raise serializers.ValidationError("Please provide a valid 10-digit mobile number.")
        return cleaned

    class Meta:
        model = BarberApplication
        fields = [
            "id",
            "owner_name",
            "shop_name",
            "mobile",
            "email",
            "address",
            "city",
            "pincode",
            "latitude",
            "longitude",
            "service_mode",
            "service_radius",
            "home_visit_charge",
            "category",
            "provides_chair_mirror",
            "haircut_shop_price",
            "haircut_home_price",
            "beard_shop_price",
            "beard_home_price",
            "aadhaar_document",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]