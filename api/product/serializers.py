from rest_framework import serializers
from .models import Product
from api.brand.serializers import BrandSerializers
from api.subcategory.serializers import SubcategorySerializer
from api.spares.models import Spare

class ProductSerializers(serializers.ModelSerializer):
    brand = BrandSerializers(many=False)
    subcategory = SubcategorySerializer(many=False, read_only=False)
    class Meta:
        model = Product
        fields = ['id','product_id','name','brand','subcategory', 'model_no','release_year','date_created','date_modified']

class ProductPostSerializers(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id','product_id','name','brand','subcategory','release_year', 'model_no','date_created','date_modified']