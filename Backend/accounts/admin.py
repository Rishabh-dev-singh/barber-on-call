from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Customer, Barber


@admin.register(User)
class MasterUserAdmin(UserAdmin):
    model = User
    list_display = (
        "username",
        "email",
        "phone",
        "role",
        "is_staff",
        "is_superuser",
        "is_active",
        "date_joined",
    )
    list_filter = (
        "role",
        "is_staff",
        "is_superuser",
        "is_active",
        "date_joined",
    )
    search_fields = (
        "username",
        "email",
        "phone",
    )
    fieldsets = UserAdmin.fieldsets + (
        (
            "Profile Details",
            {
                "fields": (
                    "phone",
                    "role",
                    "profile_picture",
                    "must_change_password",
                )
            },
        ),
    )


@admin.register(Customer)
class CustomerAdmin(UserAdmin):
    model = Customer

    list_display = (
        "username",
        "email",
        "phone",
        "is_active",
        "date_joined",
    )

    list_filter = (
        "is_active",
        "date_joined",
    )

    search_fields = (
        "username",
        "email",
        "phone",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role="customer")

    fieldsets = UserAdmin.fieldsets + (
        (
            "Customer Information",
            {
                "fields": (
                    "phone",
                    "role",
                )
            },
        ),
    )


@admin.register(Barber)
class BarberAdmin(UserAdmin):
    model = Barber

    list_display = (
        "username",
        "email",
        "phone",
        "is_active",
        "date_joined",
    )

    list_filter = (
        "is_active",
        "date_joined",
    )

    search_fields = (
        "username",
        "email",
        "phone",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role="barber")

    fieldsets = UserAdmin.fieldsets + (
        (
            "Barber Information",
            {
                "fields": (
                    "phone",
                    "role",
                    "must_change_password",
                )
            },
        ),
    )