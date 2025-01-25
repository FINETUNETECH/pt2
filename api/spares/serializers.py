from os import read
from django.db.models.fields.related import ManyToManyField
from rest_framework import serializers
from django.db.models import Q
from .models import Spare, SpareProperty, SpareVariety,SpareCosting, Discount, Quality, Type
from api.product.models import Product
from api.variant.serializers import VariantSerializer
from api.product.serializers import ProductSerializers, BrandSerializers, SubcategorySerializer

class QualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Quality
        fields = ['id','quality', 'date_added', 'date_updated',]
class TypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type
        fields = ['type', 'date_added', 'date_updated',]

class SpareCostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpareCosting
        fields = ['spare_costing_name','customer_profit_percentage','dealer_profit_percentage','service_charge','dealer_standard_profit','customer_standard_profit','date_added', 'date_updated',]

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = ['discount_name', 'discount', 'is_percent','date_added', 'date_updated',]

class SparePropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = SpareProperty
        fields = ['property_name','property_value','property_unit',]

class SpareForVarSerializer(serializers.ModelSerializer):
    type = TypeSerializer(many=False, read_only=False)
    
    class Meta:
        model = Spare
        fields = ['id','type','spare_variety','name','date_added', 'date_updated',]

class SpareVarietySerializer(serializers.HyperlinkedModelSerializer):
    spare_costing= SpareCostingSerializer(many=False, read_only=False)
    spare_discount = DiscountSerializer(many=False, read_only=False)
    quality = QualitySerializer(many=False, read_only=False)
    property = SparePropertySerializer(many=False, read_only=False)
    spare_name = serializers.SerializerMethodField()

    def get_spare_name(self, spare_variety):
        qs = Spare.objects.get(spare_variety__id = spare_variety.id)
        return SpareForVarSerializer(qs, many=False).data

    class Meta:
        model = SpareVariety
        fields = ['id','quality','variety_name','purchase_price','spare_name','retail_price','property','dealer_price', 'stock_available','spare_costing','spare_discount','is_available', 'date_added', 'date_updated',]

class SpareSerializer(serializers.ModelSerializer):
    spare_variety = SpareVarietySerializer(many=True, read_only=False)
    product = ProductSerializers(many=False, read_only=False)
    type = TypeSerializer(many=False, read_only=False)
    class Meta:
        model = Spare
        fields = ['id','type','product','spare_variety','name','date_added', 'date_updated',]

class SpareOnlySerializer(serializers.ModelSerializer):
    spare_variety = SpareVarietySerializer(many=True, read_only=False)
    type = TypeSerializer(many=False, read_only=False)
    
    class Meta:
        model = Spare
        fields = ['id','type','spare_variety','name','date_added', 'date_updated',]
        

# Reverse Lookup for batter and charger port
class ProductSpareSerializers(serializers.ModelSerializer):
    brand = BrandSerializers(many=False)
    subcategory = SubcategorySerializer(many=False, read_only=False)
    spare_battery = serializers.SerializerMethodField(source='get_spare')
    spare_charger = serializers.SerializerMethodField(source='get_spare')
    spare_display = serializers.SerializerMethodField(source='get_spare_display')
    
    @staticmethod
    def get_spare_battery(obj):
        # qs = [pa for pa in obj.spare_set.filter(name__iexact='battery')]
        qs = obj.spare_set.filter(name__iexact='battery').first()
        if qs is not None:
            var = qs.spare_variety.first()
            return  SpareVarietySerializer(var, many=False).data

    @staticmethod
    def get_spare_charger(obj):
        qs = obj.spare_set.filter(name__iexact='charger port').first()
        if qs is not None:
            var = qs.spare_variety.first()
            return  SpareVarietySerializer(var, many=False).data
    
    @staticmethod
    def get_spare_display(obj):
        qs = obj.spare_set.filter(name__iexact='Display').first()
        if qs is not None:
            return SpareOnlySerializer(qs, many=False).data


    class Meta:
        model = Product
        fields = ['id','product_id','name','brand','subcategory', 'model_no','spare_display','spare_battery','spare_charger','release_year','date_created','date_modified']