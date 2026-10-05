from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.crypto import get_random_string
from django.utils.safestring import mark_safe

from .models import BarberProfile, Service, BarberApplication, BarberSchedule, BarberReview


User = get_user_model()


class BarberScheduleInline(admin.StackedInline):
    model = BarberSchedule
    can_delete = False
    extra = 0
    max_num = 1


# ============================================================
# BARBER PROFILE ADMIN
# ============================================================

@admin.register(BarberProfile)
class BarberProfileAdmin(admin.ModelAdmin):
    inlines = [BarberScheduleInline]

    list_display = (
        "shop_name",
        "owner_name",
        "category",
        "provides_chair_mirror",
        "city",
        "pincode",
        "display_rating",
        "profile_picture_status",
        "home_service_enabled",
        "shop_service_enabled",
        "is_active",
    )

    def display_rating(self, obj):
        avg = obj.average_rating
        count = obj.total_reviews
        if avg:
            return f"⭐ {avg} ({count})"
        return "New (0)"
    display_rating.short_description = "Rating"

    list_filter = (
        "category",
        "provides_chair_mirror",
        "is_active",
        "home_service_enabled",
        "shop_service_enabled",
        "city",
    )

    search_fields = (
        "shop_name",
        "owner_name",
        "city",
        "pincode",
        "user__username",
        "user__email",
        "user__phone",
    )

    readonly_fields = (
        "profile_picture_preview",
    )

    fields = (
        "user",
        "category",
        "provides_chair_mirror",
        "profile_picture",
        "profile_picture_preview",
        "owner_name",
        "shop_name",
        "address",
        "city",
        "pincode",
        "latitude",
        "longitude",
        "home_service_enabled",
        "shop_service_enabled",
        "home_service_radius",
        "home_visit_charge",
        "is_active",
    )

    @admin.display(description="Profile Photo")
    def profile_picture_status(self, obj):

        if obj.profile_picture:
            return "✓ Photo"

        return "No Photo"

    @admin.display(description="Current Profile Photo")
    def profile_picture_preview(self, obj):

        if not obj.profile_picture:
            return "No profile picture uploaded."

        return mark_safe(
            f"""
            <div style="margin-top:10px;">
                <img
                    src="{obj.profile_picture.url}"
                    alt="Profile Picture"
                    style="
                        width:120px;
                        height:120px;
                        object-fit:cover;
                        border-radius:50%;
                        border:3px solid #f4c542;
                        display:block;
                    "
                />
            </div>
            """
        )


# ============================================================
# SERVICE ADMIN
# ============================================================

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "barber",
        "duration",
        "shop_price",
        "home_price",
        "is_active",
    )

    list_filter = (
        "is_active",
        "name",
    )

    search_fields = (
        "name",
        "barber__shop_name",
        "barber__owner_name",
    )


# ============================================================
# BARBER APPLICATION ADMIN
# ============================================================

@admin.register(BarberApplication)
class BarberApplicationAdmin(admin.ModelAdmin):

    list_display = (
        "shop_name",
        "owner_name",
        "category",
        "provides_chair_mirror",
        "mobile",
        "email",
        "city",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "category",
        "provides_chair_mirror",
        "city",
        "created_at",
    )

    search_fields = (
        "shop_name",
        "owner_name",
        "mobile",
        "email",
        "city",
    )

    readonly_fields = (
        "created_at",
    )

    actions = [
        "approve_applications",
        "reject_applications",
        "reset_password",
    ]

    # ========================================================
    # APPROVE BARBER
    # ========================================================

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if obj.status == "approved":
            self._approve_single(request, obj)

    def _approve_single(self, request, application):
        try:
            with transaction.atomic():
                username = f"BARBER{application.id:05d}"
                user = User.objects.filter(username=username).first()

                if not user:
                    password = get_random_string(
                        length=12,
                        allowed_chars=(
                            "abcdefghijklmnopqrstuvwxyz"
                            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                            "0123456789"
                            "@#$%"
                        ),
                    )
                    user = User.objects.create_user(
                        username=username,
                        email=application.email,
                        password=password,
                        phone=application.mobile,
                        role="barber",
                    )
                    new_password = password
                else:
                    new_password = None
                    user.role = "barber"
                    user.email = application.email
                    user.phone = application.mobile
                    user.save(update_fields=["role", "email", "phone"])

                barber_profile = BarberProfile.objects.filter(user=user).first()
                home_enabled = application.service_mode in ("home", "both")
                shop_enabled = application.service_mode in ("shop", "both")

                if not barber_profile:
                    barber_profile = BarberProfile.objects.create(
                        user=user,
                        category=application.category,
                        provides_chair_mirror=application.provides_chair_mirror,
                        owner_name=application.owner_name,
                        shop_name=application.shop_name,
                        address=application.address,
                        city=application.city,
                        pincode=application.pincode,
                        latitude=application.latitude,
                        longitude=application.longitude,
                        home_service_enabled=home_enabled,
                        shop_service_enabled=shop_enabled,
                        home_service_radius=application.service_radius,
                        home_visit_charge=application.home_visit_charge,
                        is_active=True,
                    )
                else:
                    barber_profile.category = application.category
                    barber_profile.provides_chair_mirror = application.provides_chair_mirror
                    barber_profile.owner_name = application.owner_name
                    barber_profile.shop_name = application.shop_name
                    barber_profile.address = application.address
                    barber_profile.city = application.city
                    barber_profile.pincode = application.pincode
                    barber_profile.latitude = application.latitude
                    barber_profile.longitude = application.longitude
                    barber_profile.home_service_enabled = home_enabled
                    barber_profile.shop_service_enabled = shop_enabled
                    barber_profile.home_service_radius = application.service_radius
                    barber_profile.home_visit_charge = application.home_visit_charge
                    barber_profile.is_active = True
                    barber_profile.save()

                if not Service.objects.filter(barber=barber_profile, name="Haircut").exists():
                    Service.objects.create(
                        barber=barber_profile,
                        name="Haircut",
                        description="Basic haircut service",
                        duration=30,
                        shop_price=application.haircut_shop_price,
                        home_price=application.haircut_home_price,
                        is_active=True,
                    )

                if not Service.objects.filter(barber=barber_profile, name="Beard").exists():
                    Service.objects.create(
                        barber=barber_profile,
                        name="Beard",
                        description="Basic beard service",
                        duration=20,
                        shop_price=application.beard_shop_price,
                        home_price=application.beard_home_price,
                        is_active=True,
                    )

                if application.status != "approved":
                    application.status = "approved"
                    application.save(update_fields=["status"])

            if new_password:
                self.message_user(
                    request,
                    (
                        f"{application.shop_name} approved successfully. "
                        f"Login ID: {username} | "
                        f"Temporary Password: {new_password}"
                    ),
                    level=messages.SUCCESS,
                )
            else:
                self.message_user(
                    request,
                    (
                        f"{application.shop_name} barber account/profile "
                        f"verified successfully. "
                        f"Login ID: {username}"
                    ),
                    level=messages.SUCCESS,
                )
        except Exception as e:
            self.message_user(
                request,
                f"{application.shop_name} failed: {str(e)}",
                level=messages.ERROR,
            )

    @admin.action(
        description="Approve / Create Barber Account"
    )
    def approve_applications(self, request, queryset):
        for application in queryset:
            self._approve_single(request, application)

    # ========================================================
    # REJECT APPLICATION
    # ========================================================

    @admin.action(
        description="Reject selected barber applications"
    )
    def reject_applications(self, request, queryset):

        updated = queryset.filter(
            status="pending"
        ).update(
            status="rejected"
        )

        self.message_user(
            request,
            f"{updated} application(s) rejected.",
            level=messages.WARNING,
        )

    # ========================================================
    # RESET PASSWORD
    # ========================================================

    @admin.action(
        description="Reset Password & Show Credentials"
    )
    def reset_password(self, request, queryset):

        for application in queryset:

            username = f"BARBER{application.id:05d}"

            user = User.objects.filter(
                username=username
            ).first()

            if not user:

                self.message_user(
                    request,
                    (
                        f"Barber account not found for "
                        f"{application.shop_name}. "
                        f"Use 'Approve / Create Barber Account' first."
                    ),
                    level=messages.ERROR,
                )

                continue

            new_password = get_random_string(
                length=12,
                allowed_chars=(
                    "abcdefghijklmnopqrstuvwxyz"
                    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                    "0123456789"
                    "@#$%"
                ),
            )

            user.set_password(new_password)

            user.save()

            self.message_user(
                request,
                (
                    f"{application.shop_name} | "
                    f"Login ID: {username} | "
                    f"New Password: {new_password}"
                ),
                level=messages.SUCCESS,
            )


# ============================================================
# BARBER SCHEDULE ADMIN
# ============================================================

@admin.register(BarberSchedule)
class BarberScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "barber",
        "slot_duration",
        "break_enabled",
        "break_start",
        "break_end",
        "updated_at",
    )
    list_filter = (
        "break_enabled",
        "slot_duration",
        "updated_at",
    )
    search_fields = (
        "barber__shop_name",
        "barber__owner_name",
        "barber__city",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )


# ============================================================
# BARBER REVIEW ADMIN
# ============================================================

@admin.register(BarberReview)
class BarberReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "barber",
        "customer",
        "rating_stars",
        "booking",
        "comment_preview",
        "created_at",
    )
    list_filter = (
        "rating",
        "created_at",
        "barber",
    )
    search_fields = (
        "barber__shop_name",
        "customer__username",
        "customer__phone",
        "comment",
    )
    readonly_fields = ("created_at",)

    def rating_stars(self, obj):
        return f"{'⭐' * obj.rating} ({obj.rating}/5)"
    rating_stars.short_description = "Rating"

    def comment_preview(self, obj):
        if obj.comment:
            return obj.comment[:60] + ("..." if len(obj.comment) > 60 else "")
        return "-"
    comment_preview.short_description = "Comment"
