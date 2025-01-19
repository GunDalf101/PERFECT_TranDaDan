from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
import urllib.parse
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from jwt.exceptions import ExpiredSignatureError
import jwt
from .utils import decode_jwt

User = get_user_model()

class DefaultAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.headers.get('Token')

        if not token:
            raise AuthenticationFailed('Authentication token not found in the request.', code=401)

        try:
            payload = decode_jwt(token)

            mfa_required = payload.get('mfa_required', False)
            if mfa_required and not request.path in ["/api/login/mfa/totp"]:
                raise AuthenticationFailed('MFA active. Please complete MFA to proceed.', code=403)
            user_id = payload.get('uid', None)
            if not user_id:
                raise Exception
            user = User.objects.get(id=user_id)

            return (user, token)

        except ExpiredSignatureError:
            raise AuthenticationFailed(f'Token expired, relogin.', code=401)
        except jwt.PyJWTError as e:
            raise AuthenticationFailed(f'invalid Token: {e}', code=401)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found.', code=404)
        except Exception:
            raise AuthenticationFailed('w00ts.', code=401)

class NoAuthenticationOnly(BaseAuthentication):
    """
    Only allow access for unuthenticated request, my opinion just serve every request both auth and non auth.
    but this is here for now.
    """
    def authenticate(self, request):
        try:
            DefaultAuthentication().authenticate(request)
        except AuthenticationFailed:
            return
        raise AuthenticationFailed("You should be anuthenticated to perform this action lol?")

class JWTAuthMiddleware(BaseMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def __call__(self, scope, receive, send):
        query_string = urllib.parse.parse_qs(scope['query_string'].decode())
        token = query_string.get('token', [None])[0]
        scope['user'] = None
        if token:
            try:
                payload = decode_jwt(token)
                mfa_required = payload.get('mfa_required', False)
                if mfa_required:
                    raise Exception
                user_id = payload['uid']
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                scope['user'] = user
            except Exception:
                pass
        return await super().__call__(scope, receive, send)
