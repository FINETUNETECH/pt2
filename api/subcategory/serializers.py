from rest_framework import serializers
from .models import SubCategory
from api.category.serializers import CategorySerializer

class SubcategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(many=False, read_only=False)
    class Meta:
        model = SubCategory
        fields = ['id','category','name',]