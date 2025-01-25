from xml.dom.expatbuilder import parseString
from django.http import Http404, JsonResponse

from django.shortcuts import get_object_or_404

from api.brand.models import Brand
from api.spares.models import Quality, Spare, SpareProperty, SpareVariety, Type
from api.subcategory.models import SubCategory
from .serializers import ProductPostSerializers, ProductSerializers
from api.spares.serializers import ProductSpareSerializers, SpareVarietySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product
from api.product import serializers

class ProductList(APIView):
    def removeSpace(self, string):
        stringify = str(string)
        return stringify.replace(" ", "")

    def getBrand(self, brand):
        brand = get_object_or_404(Brand, name=brand)
        return brand
    
    def getSubCat(self, sub):
        sub_category = get_object_or_404(SubCategory, name=sub)
        return sub_category

    def get(self, request):
        brand = request.GET.get('brand', None)
        if(brand):
            queryset = Product.objects.filter(brand__name__iexact = brand)
            serializer_class = ProductSerializers(queryset, many=True)
            return Response(serializer_class.data)
        else:
            queryset = Product.objects.all().order_by('-id')
            serializer_class = ProductSerializers(queryset, many=True)
            return Response(serializer_class.data)
            
    def post(self, request):
        data = request.data
        for each in data:
            content = each['data']
            get_brand = self.getBrand(content['brand']['name'])
            get_subcategory = SubCategory.objects.get(name__iexact='mobile')
            del content['brand']
            content['brand'] = get_brand.id
            content['subcategory'] = get_subcategory.id
            product_name= content['name']
            brand_name = get_brand.name
            product_id = '%s%s'%(self.removeSpace(brand_name),self.removeSpace(product_name))
            content['product_id'] = product_id
            serializer_class = ProductPostSerializers(data=content)
            
            if serializer_class.is_valid():

                serializer_class.save()
            else:
                return Response(serializer_class.data, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer_class.data, status=status.HTTP_201_CREATED)
        
class ProductDetail(APIView):
    def get(self, request, model=None, brand=None):
        if(brand):
            queryset = Product.objects.filter(model_no__iexact=model, brand__name__icontains=brand)
        else:
             queryset = Product.objects.filter(model_no__iexact=model)
        serializer_class = ProductSerializers(queryset, many=True)
        return Response(serializer_class.data)

# CRUD Operation
class ProductDetailViewset(APIView):
    def getProduct(self, product_id):
        try:
            return Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            raise Http404

    def getBrand(self, name):
        try:
            return Brand.objects.get(name__iexact=name)
        except Product.DoesNotExist:
            raise Http404

    def put(self, request):
        data = request.data
        for each in data:
            if 'brand' in each['data']:
                brand = self.getBrand(each['data']['brand']['name'])
                del each['data']['brand']

                each['data']['brand'] = brand.id

            queryset = self.getProduct(each['key'])
            serializer_class = ProductPostSerializers(queryset, data=each['data'], partial=True)

            if serializer_class.is_valid():
                serializer_class.save()
            else:
                return Response(serializer_class.data, status=status.HTTP_400_BAD_REQUEST)
        return JsonResponse(serializer_class.data, status=status.HTTP_200_OK)
        

    def delete(self, request):
        data = request.data
        for each in data:
            queryset = self.getProduct(each['key'])
            queryset.delete()
        return JsonResponse({"status":"ok"}, status=status.HTTP_200_OK)

# Battery & Charger Port Spare CRUD
class ProductBatteryAndChargerPort(APIView):
    def getProduct(self, product_id):
        try:
            return Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            raise Http404
            
    def get(self, request):
        queryset = Product.objects.all().order_by('-id')
        serializer_class = ProductSpareSerializers(queryset, many=True)
        return Response(serializer_class.data)
    
    def put(self, request):
        data = request.data
        for each in data:
            queryset = self.getProduct(each['key'])
            # Saving product release year
            if 'release_year' in each['data']:
                queryset.release_year = each['data']['release_year']
                queryset.save()
            # Updating product model no
            if 'model_no' in each['data']:
                queryset.model_no = each['data']['model_no']
                queryset.save()
            # checking if display type changed and saving it
            if 'spare_display' in each['data']:
                # get Type from type models
                get_type = get_object_or_404(Type, type=each['data']['spare_display']['type']['type'])
                if (Spare.objects.filter(product__product_id=queryset.product_id, name='Display').exists()):
                    get_spare = Spare.objects.get(product__product_id=queryset.product_id, name='Display')
                    get_spare.type = get_type
                    get_spare.save()
                else:
                    new_spare = Spare.objects.create(product=queryset, name='Display',type=get_type)
                    new_spare.save()

            # check for existing battery spare
            if 'spare_battery' in each['data']:
                if(Spare.objects.filter(product__product_id=queryset.product_id, name__iexact='battery').exists()):
                    get_spare = Spare.objects.get(product__product_id=queryset.product_id, name__iexact='battery')
                    get_variety = get_spare.spare_variety.all().first()
                    
                    purchase_price = 0.25* int(each['data']['spare_battery']['property']['property_value']) # base price & not purchase price
                    retail_price = purchase_price + 200

                    if get_variety is None:
                        # get if property exists
                        if SpareProperty.objects.filter(property_value = each['data']['spare_battery']['property']['property_value']).exists():
                            get_property =  SpareProperty.objects.get(property_value = each['data']['spare_battery']['property']['property_value'])
                        else:
                            get_property = SpareProperty.objects.create(property_value=each['data']['spare_battery']['property']['property_value'], property_unit="MAH")
                            get_property.save()

                        get_variety = SpareVariety.objects.create(property=get_property,purchase_price=purchase_price, retail_price=retail_price)
                        get_variety.save()
                        get_spare.spare_variety.add(get_variety)
                        get_spare.save()
                    else:
                        get_variety.property.property_value = each['data']['spare_battery']['property']['property_value']
                        get_variety.property.save()
                        get_variety.purchase_price = purchase_price
                        get_variety.retail_price = retail_price
                        get_variety.save()
                else:
                    # get if property exists
                    if SpareProperty.objects.filter(property_value = each['data']['spare_battery']['property']['property_value']).exists():
                        get_property =  SpareProperty.objects.get(property_value = each['data']['spare_battery']['property']['property_value'])
                    else:
                        get_property = SpareProperty.objects.create(property_value=each['data']['spare_battery']['property']['property_value'], property_unit="MAH")
                        get_property.save()
                    
                    # saving new spare_variety
                    purchase_price = 0.25* int(each['data']['spare_battery']['property']['property_value']) # base price & not purchase price
                    retail_price = purchase_price + 200

                    new_spare_variety = SpareVariety.objects.create(property=get_property,purchase_price=purchase_price, retail_price=retail_price)
                    new_spare_variety.save()
                    
                    # saving new spare
                    new_spare = Spare.objects.create(product=queryset, name='Battery')
                    new_spare.spare_variety.add(new_spare_variety)
                    new_spare.save()
            if 'spare_charger' in each['data']:
                if(Spare.objects.filter(product__product_id=queryset.product_id, name__iexact='charger port').exists()):
                    get_spare = Spare.objects.get(product__product_id=queryset.product_id, name__iexact='charger port')
                    get_variety = get_spare.spare_variety.all().first()
                    if get_variety is not None:
                        # if 'release_year' in each['data']['spare_charger']:
                        #     get_variety.release_year = each['data']['spare_charger']['release_year']
                        if 'variety_name' in each['data']['spare_charger']:
                            get_variety.variety_name = each['data']['spare_charger']['variety_name']
                        get_variety.save()

                    else:
                        # if 'release_year' in each['data']['spare_charger'] and 'variety_name' in each['data']['spare_charger']:
                        #     new_variety = SpareVariety.objects.create(variety_name=each['data']['spare_charger']['variety_name'], release_year=each['data']['spare_charger']['release_year'])
                        #     new_variety.save()
                        if 'variety_name' in each['data']['spare_charger']:
                            new_variety = SpareVariety.objects.create(variety_name=each['data']['spare_charger']['variety_name'])
                            new_variety.save()
                        elif 'release_year' in each['data']['spare_charger']:
                            new_variety = SpareVariety.objects.create(release_year=each['data']['spare_charger']['release_year'])
                            new_variety.save()

                        get_spare.spare_variety.add(new_variety)
                        get_spare.save()
                    # get quality
                    # if 'quality' in each['data']['spare_charger']:
                    #     get_quality = Quality.objects.get(quality=each['data']['spare_charger']['quality']['quality'])

                    #     get_variety.quality = get_quality
                    
                else:
                    # get_quality = Quality.objects.get(quality=each['data']['spare_charger']['quality']['quality'])
                    if 'release_year' in each['data']['spare_charger'] and 'variety_name' in each['data']['spare_charger']:
                        new_spare_variety = SpareVariety.objects.create(variety_name=each['data']['spare_charger']['variety_name'], release_year=each['data']['spare_charger']['release_year'])
                        new_spare_variety.save()
                    elif 'variety_name' in each['data']['spare_charger']:
                        new_spare_variety = SpareVariety.objects.create(variety_name=each['data']['spare_charger']['variety_name'])
                        new_spare_variety.save()
                    elif 'release_year' in each['data']['spare_charger']:
                        new_spare_variety = SpareVariety.objects.create(release_year=each['data']['spare_charger']['release_year'])
                        new_spare_variety.save()

                    new_spare = Spare.objects.create(product=queryset, name='Charger port')
                    new_spare.spare_variety.add(new_spare_variety)
                    new_spare.save()

            # serializer_class = ProductSpareSerializers(queryset, data=each['data'], partial=True)

            # if serializer_class.is_valid():
            #     serializer_class.save()
            # else:
            #     return Response(serializer_class.data, status=status.HTTP_400_BAD_REQUEST)
        return Response({'success': True},status=status.HTTP_200_OK)
    
    def delete(self, request):
        data = request.data
        for each in data:
            queryset = self.getProduct(each['key'])
            queryset.delete()
        return JsonResponse({"status":"ok"}, status=status.HTTP_200_OK)