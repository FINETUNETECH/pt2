from rest_framework import serializers
from .models import UserNotifications, CustomUser

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotifications
        fields = ['id','user','notification_heading','notification_content','is_read','date_created','date_modified',]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'phone', 'email', 'is_staff', 'is_store','is_premium',]

class ChangePasswordSerializer(serializers.Serializer):
    model =CustomUser
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)