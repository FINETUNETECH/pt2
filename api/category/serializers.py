from rest_framework import serializers
from .models import Category
from api.department.serializers import DepartmentSerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        department = DepartmentSerializer(many=False, read_only=False)
        fields = ['department','name','date_added','date_modified',]