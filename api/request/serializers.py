from dataclasses import fields
from pyexpat import model
from rest_framework import serializers
from .models import Request

class RequestSerializers(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields= ['user', 'brand','product','model','issue','is_completed',]