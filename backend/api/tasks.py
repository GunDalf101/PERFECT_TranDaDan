from background_task import background
from django.contrib.auth import get_user_model

User = get_user_model()

@background(name='send_registration_email')
def send_registration_email(user_id):
    user = User.objects.get(pk=user_id)
    confirmation_link = user.generate_verification_link()
    user.send_email(f'Welcome onboard, please verify your email by clicking this <a href={confirmation_link}>link</a>.')
