from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("customer", "Customer"),
        ("barber", "Barber"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="customer"
    )

    phone = models.CharField(
        max_length=15,
        blank=True
    )

    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )

    must_change_password = models.BooleanField(
        default=False
    )

    def __str__(self):
        return f"{self.username} - {self.role}"


class Customer(User):
    class Meta:
        proxy = True
        verbose_name = "Customer"
        verbose_name_plural = "Customers"


class Barber(User):
    class Meta:
        proxy = True
        verbose_name = "Barber"
        verbose_name_plural = "Barbers"


class PhoneOTP(models.Model):
    phone = models.CharField(
        max_length=15,
        db_index=True
    )
    otp = models.CharField(
        max_length=6
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    is_verified = models.BooleanField(
        default=False
    )
    attempts = models.PositiveIntegerField(
        default=0
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Phone OTP"
        verbose_name_plural = "Phone OTPs"

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=5)

    def __str__(self):
        return f"{self.phone} - {self.otp} ({'Verified' if self.is_verified else 'Pending'})"
        