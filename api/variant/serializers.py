from rest_framework import serializers
from .models import Property,Variant
from api.product.serializers import ProductSerializers

class PropertySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model= Property
        fields = ['property_name','property_value',]

class VariantSerializer(serializers.HyperlinkedModelSerializer):
    product = ProductSerializers(many=False, read_only=False)
    property = PropertySerializer(many=True, read_only=False)
    class Meta:
        model= Variant
        fields = ['product','variant_name','property','date_created',]
