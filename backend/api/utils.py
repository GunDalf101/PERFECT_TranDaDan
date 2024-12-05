
import random
import string

def unset_cookie_header(cookie):
    return {"Set-Cookie": f"{cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax"}

def get_free_username(User, username):
    while User.objects.filter(username=username).first():
        username = f"{username}_{''.join(random.choices(string.ascii_letters + string.digits, k=5))}"
    return username