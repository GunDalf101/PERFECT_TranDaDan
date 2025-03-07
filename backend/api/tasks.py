from background_task import background
from django.core.mail import send_mail
from django.conf import settings

EMAIL_HOST_USER = settings.EMAIL_HOST_USER

def _send_email(email, subject, message):
    try:
        print(f"📧 ({email}): {message}")
        send_mail(
            subject,
            message,
            'wizards@trandadan.live',
            [email],
            html_message=message,
            # fail_silently=True,
        )
    except Exception as e:
        print(e)
        pass

@background(name='send_registration_email')
def send_registration_email(link, email):
    _send_email(email, "Welcome to TranDanDan!", f'Welcome onboard, please verify your email by clicking this <a href={link}>link</a>.')

@background(name='send_rest_password_email')
def send_reset_password_email(link, email):
    _send_email(email, "Reset your password!", f'We heard you forgot your pass! we got you, reset the password of your account by clicking this <a href={link}>link</a>.')
