from django.apps import AppConfig

# cause merge issue
class NotifsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifs'
