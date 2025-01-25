from dataclasses import field
from rest_framework import serializers
from .models import Brand


class BrandSerializers(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id','name', 'logo', 'date_added', 'date_modified',]