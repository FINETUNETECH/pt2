from rest_framework import fields, serializers
from .models import Unit

class UnitSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Unit
        fields = ['unit','date_added','date_modified',]