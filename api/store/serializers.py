from rest_framework import serializers
from user.serializers import UserSerializer
from .models import Stores

class StoreSerializer(serializers.ModelSerializer):
    manager = UserSerializer(many=False)
    class Meta:
        model = Stores
        fields = ['id','manager','store_name','store_address','date_added','date_modified']

class StoreStaffSerializer(serializers.ModelSerializer):
    store = StoreSerializer(many=False)
    staff = UserSerializer(many=False)
    class Meta:
        model = Stores
        fields = ['id','store','staff','date_added','date_modified']

class StoreListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stores
        fields = ['id','manager','store_name','store_address','date_added','date_modified']