from django.db import models
from accounts.models import User


class BarberProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="barber_profile"
    )

    owner_name = models.CharField(
        max_length=100
    )

    shop_name = models.CharField(
        max_length=150
    )

    profile_picture = models.ImageField(
        upload_to="barber_profiles/",
        blank=True,
        null=True
    )

    address = models.TextField()

    city = models.CharField(
        max_length=100
    )

    pincode = models.CharField(
        max_length=10
    )

    latitude = models.FloatField(
        null=True,
        blank=True
    )

    longitude = models.FloatField(
        null=True,
        blank=True
    )

    home_service_enabled = models.BooleanField(
        default=True
    )

    shop_service_enabled = models.BooleanField(
        default=True
    )

    home_service_radius = models.FloatField(
        default=10
    )

    home_visit_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    CATEGORY_CHOICES = [
        ("standard", "Standard Barber"),
        ("premium", "Premium Barber"),
    ]

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="standard",
    )

    provides_chair_mirror = models.BooleanField(
        default=False,
        help_text="Whether barber provides portable chair and mirror for home visits",
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.shop_name

    @property
    def average_rating(self):
        agg = self.reviews.aggregate(models.Avg("rating"))
        val = agg.get("rating__avg")
        return round(float(val), 1) if val is not None else None

    @property
    def total_reviews(self):
        return self.reviews.count()


class Service(models.Model):
    barber = models.ForeignKey(
        BarberProfile,
        on_delete=models.CASCADE,
        related_name="services"
    )

    name = models.CharField(
        max_length=100
    )

    description = models.TextField(
        blank=True
    )

    duration = models.PositiveIntegerField(
        help_text="Duration in minutes"
    )

    shop_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    home_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.barber.shop_name} - {self.name}"


class BarberApplication(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    owner_name = models.CharField(
        max_length=100
    )

    shop_name = models.CharField(
        max_length=150
    )

    mobile = models.CharField(
        max_length=15
    )

    email = models.EmailField(
        blank=True,
        default=""
    )

    address = models.TextField()

    city = models.CharField(
        max_length=100
    )

    pincode = models.CharField(
        max_length=10,
        blank=True,
        default=""
    )

    latitude = models.FloatField(
        null=True,
        blank=True
    )

    longitude = models.FloatField(
        null=True,
        blank=True
    )

    service_mode = models.CharField(
        max_length=20
    )

    service_radius = models.FloatField(
        default=5
    )

    home_visit_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    category = models.CharField(
        max_length=20,
        choices=[
            ("standard", "Standard Barber"),
            ("premium", "Premium Barber"),
        ],
        default="standard",
    )

    provides_chair_mirror = models.BooleanField(
        default=False,
        help_text="Can provide portable chair and mirror for home visits",
    )

    haircut_shop_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    haircut_home_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    beard_shop_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    beard_home_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    aadhaar_document = models.FileField(
        upload_to="barber_applications/aadhaar/"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.shop_name} - {self.owner_name}"


def default_weekly_schedule():
    days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    shop_schedule = []
    home_schedule = []
    for day in days:
        shop_schedule.append({
            "id": day.lower(),
            "day": day,
            "enabled": day != "Sunday",
            "open": "10:00",
            "close": "20:00",
        })
        home_schedule.append({
            "id": day.lower(),
            "day": day,
            "enabled": day != "Sunday",
            "open": "11:00",
            "close": "18:00",
        })
    return {
        "shop": shop_schedule,
        "home": home_schedule,
    }


class BarberSchedule(models.Model):
    barber = models.OneToOneField(
        BarberProfile,
        on_delete=models.CASCADE,
        related_name="schedule",
    )
    slot_duration = models.PositiveIntegerField(
        default=30,
        help_text="Duration per booking slot in minutes",
    )
    break_enabled = models.BooleanField(
        default=True,
        help_text="Whether the barber takes a daily break",
    )
    break_start = models.CharField(
        max_length=10,
        default="13:00",
        help_text="Break start time in HH:MM (24h)",
    )
    break_end = models.CharField(
        max_length=10,
        default="14:00",
        help_text="Break end time in HH:MM (24h)",
    )
    weekly_schedule = models.JSONField(
        default=default_weekly_schedule,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Barber Schedule"
        verbose_name_plural = "Barber Schedules"

    def __str__(self):
        return f"Schedule for {self.barber.shop_name}"

    def get_schedule_dict(self):
        if not self.weekly_schedule:
            return default_weekly_schedule()
        return self.weekly_schedule


class BarberReview(models.Model):
    barber = models.ForeignKey(
        BarberProfile,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="barber_reviews",
    )
    booking = models.OneToOneField(
        "bookings.BookingRequest",
        on_delete=models.SET_NULL,
        related_name="review",
        null=True,
        blank=True,
    )
    rating = models.PositiveSmallIntegerField(
        help_text="Rating from 1 to 5 stars"
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Barber Review"
        verbose_name_plural = "Barber Reviews"

    def __str__(self):
        return f"{self.customer} - {self.barber.shop_name} ({self.rating}★)"
