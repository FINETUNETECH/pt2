# api/brand/apps.py
from django.apps import AppConfig

class BrandConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api.brand'
    label = 'api_brand'