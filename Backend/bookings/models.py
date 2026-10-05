from django.db import models

# Create your models here.
from django.db import models

class BookingRequest(models.Model):
    BOOKING_TYPE_CHOICES = (
        ('home', 'Home'),
        ('shop', 'Shop'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('awaiting_payment', 'Awaiting Payment'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
        ('payment_failed', 'Payment Failed'),
    )

    customer = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='booking_requests',
        limit_choices_to={'role': 'customer'},
        help_text="Only users with the 'customer' role can make bookings."
    )
    service = models.ForeignKey(
        'barbers.Service',
        on_delete=models.CASCADE,
        related_name='booking_requests_legacy',
        null=True,
        blank=True,
        help_text="Primary service (kept for backwards compatibility)"
    )
    services = models.ManyToManyField(
        'barbers.Service',
        related_name='booking_requests',
        blank=True,
        help_text="All services included in this booking"
    )
    booking_type = models.CharField(max_length=10, choices=BOOKING_TYPE_CHOICES)
    needs_chair_mirror = models.BooleanField(
        default=False,
        help_text="Whether customer requested barber to bring portable chair and mirror",
    )
    booking_date = models.DateField()
    booking_time = models.TimeField()
    address = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    PAYMENT_METHOD_CHOICES = (
        ('online', 'Online (Razorpay)'),
        ('cash', 'Cash'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='online'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    accepted_barber = models.ForeignKey(
        'barbers.BarberProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_bookings'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def get_services_display(self):
        names = list(self.services.values_list("name", flat=True))
        if names:
            return ", ".join(names)
        if self.service:
            return self.service.name
        return "No service specified"

    def __str__(self):
        return f"Booking #{self.id} - {self.customer} ({self.get_services_display()}) on {self.booking_date} ({self.status})"


class Payment(models.Model):
    STATUS_CHOICES = (
        ('created', 'Created'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    booking = models.ForeignKey(
        BookingRequest,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    razorpay_order_id = models.CharField(max_length=100)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} for Booking #{self.booking_id} ({self.status})"


class BookingOffer(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('already_accepted', 'Already Accepted'),
        ('cancelled', 'Cancelled'),
    )

    booking = models.ForeignKey(
        BookingRequest,
        on_delete=models.CASCADE,
        related_name='offers'
    )
    barber = models.ForeignKey(
        'barbers.BarberProfile',
        on_delete=models.CASCADE,
        related_name='booking_offers'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['booking', 'barber'], 
                name='unique_booking_offer_per_barber'
            )
        ]

    def __str__(self):
        return f"Offer for Booking #{self.booking_id} to Barber #{self.barber_id} ({self.status})"
class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ("booking_request", "Booking Request"),
        ("booking_accepted", "Booking Accepted"),
        ("booking_rejected", "Booking Rejected"),
        ("awaiting_payment", "Awaiting Payment"),
        ("payment_received", "Payment Received"),
        ("booking_confirmed", "Booking Confirmed"),
        ("booking_completed", "Booking Completed"),
        ("booking_cancelled", "Booking Cancelled"),
    )

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    booking = models.ForeignKey(
        BookingRequest,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPE_CHOICES,
    )

    title = models.CharField(max_length=150)

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.title}"