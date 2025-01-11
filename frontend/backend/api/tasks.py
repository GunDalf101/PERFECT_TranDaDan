from background_task import background

def send_email(email, message):
    print(f"📧 ({email}): {message}")

@background(name='send_registration_email')
def send_registration_email(link, email):
    send_email(email, f'Welcome onboard, please verify your email by clicking this <a href={link}>link</a>.')

@background(name='send_rest_password_email')
def send_reset_password_email(link, email):
    send_email(email, f'We heard you forgot your pass! we got you, reset the password of your account by clicking this <a href={link}>link</a>.')
