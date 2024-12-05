from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth import get_user_model

User = get_user_model()

class DefaultAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('auth')
        
        if not token:
            raise AuthenticationFailed('Authentication token not found in cookies.', code=401)
        
        try:
            access_token = AccessToken(token)
            
            access_token.verify()
            
            mfa_required = access_token.get('mfa_required', False)
            if mfa_required and not request.path in ["/api/login/mfa/totp"]:
                raise AuthenticationFailed('MFA active. Please complete MFA to proceed.', code=403)
            
            user_id = access_token[api_settings.USER_ID_CLAIM]
            user = User.objects.get(id=user_id)
            
            return (user, access_token)
        
        except TokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}', code=401)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found.', code=404)

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