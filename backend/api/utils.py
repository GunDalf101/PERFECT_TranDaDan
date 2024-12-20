
import random
import string
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.core.cache import cache
from .tasks import send_reset_password_email
from django.core import serializers

User = get_user_model()

def unset_cookie_header(cookie):
    return {"Set-Cookie": f"{cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax"}

def get_free_username(username):
    while User.objects.filter(username=username).first():
        username = f"{username}_{''.join(random.choices(string.ascii_letters + string.digits, k=5))}"
    return username

def get_reset_password_token_cache_key(token):
    return f"api_user_rest_password_token_{token}"

def reset_password_for_user(user_id, email, link, token):
    cache_key = get_reset_password_token_cache_key(token)
    expiration_time = timedelta(hours=1)
    cache.set(cache_key, user_id, timeout=expiration_time.total_seconds())
    send_reset_password_email(link, email)

def find_user_id_by_reset_token(token):
    cache_key = get_reset_password_token_cache_key(token)
    user_id = cache.get(cache_key)
    if not user_id:
        return None
    cache.delete(cache_key)
    return int(user_id)

def minuser(a, b):
    return min([a, b], key=lambda user: user.id)

def maxuser(a, b):
    return max([a, b], key=lambda user: user.id)