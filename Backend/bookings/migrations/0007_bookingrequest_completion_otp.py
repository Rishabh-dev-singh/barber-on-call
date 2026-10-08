import random
from django.db import migrations, models


def generate_completion_otps(apps, schema_editor):
    BookingRequest = apps.get_model('bookings', 'BookingRequest')
    for booking in BookingRequest.objects.all():
        if not booking.completion_otp:
            booking.completion_otp = f"{random.randint(1000, 9999)}"
            booking.save(update_fields=['completion_otp'])


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0006_bookingrequest_needs_chair_mirror'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookingrequest',
            name='completion_otp',
            field=models.CharField(
                blank=True,
                default='',
                help_text='4-digit secure OTP given to customer to verify service completion',
                max_length=6,
            ),
        ),
        migrations.RunPython(generate_completion_otps, reverse_code=migrations.RunPython.noop),
    ]

