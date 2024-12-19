from django.contrib.auth import get_user_model, authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken
from .authentication import NoAuthenticationOnly
from django.http import HttpResponseRedirect
import requests
import random
import string
import environ
import jwt
from django.urls import reverse
from django.utils import timezone
from django.conf import settings
from .utils import unset_cookie_header, get_free_username, reset_password_for_user, find_user_id_by_reset_token
from .serializers import RegisterSerializer, LoginSerializer, RequestResetPasswordSerializer, ResetPasswordSerializer
from .tasks import send_registration_email
from .models import IntraConnection
import pyotp
import pyqrcode
import io
from django.core import serializers
from django.utils.crypto import get_random_string

User = get_user_model()

env = environ.Env()
environ.Env.read_env()

class UnprotectedView(APIView):
    # ugh, currently refuse authenticated requests? empty array to accept all requests.
    authentication_classes = [NoAuthenticationOnly]

class OAuth2StartView(UnprotectedView):

    def get(self, request, *args, **kwargs):
        state = ''.join(random.choices(string.ascii_letters + string.digits, k=30))
        authorization_url = f'{env.str("42_AUTHORIZE_URL")}?client_id={env.str("CLIENT_ID")}&redirect_uri={request.build_absolute_uri(reverse("oauth2-callback"))}&response_type=code&state={state}'
        response = HttpResponseRedirect(authorization_url)
        response.set_cookie('oauth2_state', jwt.encode({"state": state}, settings.SECRET_KEY, algorithm='HS256'))
        return response


class OAuth2CallbackView(UnprotectedView):
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        code = request.GET.get('code')
        state = request.GET.get('state')

        saved_state = request.COOKIES.get('oauth2_state')
        if not saved_state or state != jwt.decode(saved_state, settings.SECRET_KEY, algorithms=['HS256'])["state"]:
            return Response({"message": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        data = {
            'grant_type': 'authorization_code',
            'client_id': env.str("CLIENT_ID"),
            'client_secret': env.str("CLIENT_SECRET"),
            'redirect_uri': request.build_absolute_uri(reverse('oauth2-callback')),
            'code': code,
        }

        response = requests.post(env.str("42_TOKEN_URL"), data=data)
        if response.status_code != status.HTTP_200_OK:
            return Response({"message": "Failed to get access token"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        access_token = response.json().get('access_token')
        if not access_token:
            return Response({"message": "No access token found"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        user_info_url = env.str("42_API_ME_URL")
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)

        if user_info_response.status_code != status.HTTP_200_OK:
            return Response({"message": "Failed to fetch user info from 42"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        user_data = user_info_response.json()
        intra_uid = user_data.get('id')
        username = user_data.get('login')
        email = user_data.get('email')
        avatar_url = user_data.get('image', {}).get('link')

        user = User.objects.filter(intra_connection__uid=intra_uid).first()

        message = "successfully logged in."

        # if user:
        #     if not user.intra_user:
        #         # user.username = username
        #         # user.avatar_url = avatar_url
        #         user.intra_user = True
        #         user.email_verified = True
        #         user.set_password("")
        #         user.save()
        #         message = f"We have found an existing account for you, you can update your username is settings."
        # else:
        #     user = User.objects.create_user(
        #         username=get_free_username(User, username),
        #         email=email,
        #         avatar_url=avatar_url,
        #         intra_user=True,
        #         online=True,
        #         email_verified=True
        #     )
        #     message = f"registration successful!{' your username has already been claimed, we generated a new one for you.' if user.username != username else '' }"

        if not user:
            user = User.objects.create_user(
                email=None,
                username=get_free_username(username),
                intra_user=True,
                online=True
            )
            intra_connection = IntraConnection.objects.create(
                user=user,
                uid=intra_uid,
                email=email,
                avatar_url=avatar_url
            )
            message = f"registration successful!{' your username has already been claimed, we generated a new one for you.' if user.username != username else '' }"

        access_token = AccessToken.for_user(user)
        access_token["mfa_required"] = user.mfa_enabled

        return Response({
            "access_token": str(access_token),
            "message": message,
            "user_id": user.id,
            "mfa_required": user.mfa_enabled
        }, status=status.HTTP_200_OK, headers=unset_cookie_header("oauth2_state"))


class MFATOTPView(APIView):

    def post(self, request):
        current_user = request.user 

        if not current_user.mfa_enabled:
            return Response({
                "error": "MFA is not enabled for this user."
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        data = request.data
        if not data.get("code") or not isinstance(data.get("code"), str) or not data.get("code").isnumeric():
            return Response({
                "error": "Invalid code."
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not pyotp.totp.TOTP(current_user.mfa_totp_secret).verify(data.get("code")):
            return Response({
                "error": "Invalid code."
            }, status=status.HTTP_401_UNAUTHORIZED)
        access_token = AccessToken.for_user(current_user)
        access_token["mfa_required"] = False
        return Response({
            "access_token": str(access_token),
            "user_id": current_user.id,
            "mfa_required": False
        }, status=status.HTTP_200_OK)

class SecurityMFATOTP(APIView):

    def put(self, request):
        current_user = request.user 

        if current_user.mfa_enabled:
            return Response({
                "error": "MFA is already enabled for this user."
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        secret_totp = pyotp.random_base32()
        url_qr = pyotp.totp.TOTP(secret_totp).provisioning_uri(current_user.username, issuer_name='TranDanDan')
        svg_buffer = io.BytesIO()
        pyqrcode.create(url_qr).svg(svg_buffer, scale=8)
        current_user.mfa_totp_secret = secret_totp
        current_user.mfa_enabled = True
        current_user.save()
        return Response({
            "user_id": current_user.id,
            "mfa_enabled": current_user.mfa_enabled,
            "svg": svg_buffer.getvalue().decode()
        }, status=status.HTTP_200_OK)
    
    def delete(self, request):
        current_user = request.user

        if not current_user.mfa_enabled:
            return Response({
                "error": "MFA is not enabled for this user."
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        current_user.mfa_enabled = False
        current_user.mfa_totp_secret = ''
        current_user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RegisterView(UnprotectedView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            token = user.email_token
            confirmation_link = request.build_absolute_uri(reverse("verify-email", kwargs={"token": token}))
            send_registration_email(confirmation_link, user.email, schedule=timezone.now())
            return Response({
                "message": "User registered successfully, please verify your email.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "avatar_url": user.avatar_url
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class ResetPasswordView(UnprotectedView):

    def post(self, request, token):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user_id = find_user_id_by_reset_token(token)
            if not user_id:
                return Response({"error": "invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
            password = serializer.validated_data['password']
            user = User.objects.get(id=user_id) # if this raises DoesNotExist then smtg is fucked up, since we dont even support account deletion?
            user.set_password(password)
            user.save()
            return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RequestResetPasswordView(UnprotectedView):

    def post(self, request):
        serializer = RequestResetPasswordSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']

            user = User.objects.filter(email=email).first()
            if user and user.email_verified:
                token = get_random_string(32)
                reset_password_for_user(user.id, user.email, f"{env.str('FRONTEND_URL')}/{token}", token)
            return Response({
                "message": "if a user exists with a verified email that you specified, you will receive a reset password token in your inbox.",
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(UnprotectedView):

    def get(self, _, token):
        try:
            user = User.objects.get(email_token=token)
            user.email_token = ""
            user.email_verified = True
            user.save()
            return Response({"message": "email verified."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"message": "token not valid."}, status=status.HTTP_404_NOT_FOUND)
        
class LoginView(UnprotectedView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, email=email, password=password)
            if user:
                access_token = AccessToken.for_user(user)
                access_token["mfa_required"] = user.mfa_enabled
                return Response({
                    "access_token": str(access_token),
                    "message": "logged in successfully!",
                    "user_id": user.id,
                    "mfa_required": user.mfa_enabled
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UsersMeView(APIView):
    
    def get(self, request):
        user = request.user
        
        ic = getattr(user, 'intra_connection', None)
        if ic:
            ic = serializers.serialize('json', [ic])
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'intra_connection': ic
        }
        
        return Response(user_data, status=status.HTTP_200_OK)
