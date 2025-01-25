from django.http import Http404
from .models import Quality, Spare, SpareVariety,SpareCosting, Discount
from rest_framework.response import Response
from rest_framework import mixins, generics, viewsets
from .serializers import SpareVarietySerializer,SpareCostingSerializer,SpareSerializer, QualitySerializer
from api.spares import serializers
from rest_framework.views import APIView
from django.db.models import Q
from rest_framework import status

# ViewSets define the view behavior.
class spareList(APIView):
    def get(self, request):
        queryset = Spare.objects.all().order_by('-date_added')
        serializer_class = SpareSerializer(queryset, many=True)
        return Response(serializer_class.data)

class qualityList(APIView):
    def get(self, request):
        queryset = Quality.objects.all().order_by('-date_added')
        serializer_class = QualitySerializer(queryset, many=True)
        return Response(serializer_class.data)

class qualityDetailView(APIView):
    def get(self,   request,pk):
        queryset = Quality.objects.get(pk=pk)
        serializer_class = QualitySerializer(queryset, many=False)
        return Response(serializer_class.data)

class SpareCostingMethodList(APIView):
    def get(self, request):
        queryset = SpareCosting.objects.all()
        serializer_class = SpareCostingSerializer(queryset, many=True)
        return Response(serializer_class.data)

class SpareDetail(APIView):
    def get(self, request, product):
        queryset = Spare.objects.filter(product__name__icontains = product)
        serializer_class = SpareSerializer(queryset, many=True)
        return Response(serializer_class.data)

class GetPrice(APIView):
    def get(self, request, product, issue):
        model = request.GET.get('model', None)
        try:
            if model:
                queryset = Spare.objects.filter(Q(product__name__iexact = product) & Q(product__model_no__icontains = model)& Q(name__iexact=issue))
            else:
                queryset = Spare.objects.filter(Q(product__name__iexact = product)& Q(name__iexact=issue))
            serializer_class = SpareSerializer(queryset, many=True)
            return Response(serializer_class.data)
        except:
            return Response({'error': 'Something went wrong!'})


class SearchSpare(APIView):
    def get(self, request):
        brand = request.GET.get('brand', None)
        product = request.GET.get('product', None)
        spare = request.GET.get('spare', None)

        if brand and product == 'undefined' or product == '' or product==None:
            queryset = Spare.objects.filter(product__brand__name__iexact =brand).order_by('-date_added')
        elif brand and product and spare == 'null':
            queryset = Spare.objects.filter(product__model_no__iexact = product).order_by('-date_added')
        elif brand and product and spare != 'null':
            queryset =Spare.objects.filter(Q(product__brand__name__iexact = brand) & Q(product__model_no__iexact = product)& Q(name__iexact=spare))
        serializer = SpareSerializer(queryset, many=True)

        return Response(serializer.data)

class SpareDetailViewSet(APIView):
    def get_object(self, id):
        try:
            return Spare.objects.get(id=id)
        except Spare.DoesNotExist:
            raise Http404

    def get(self, request, id):
        queryset = self.get_object(id)
        serializer = SpareSerializer(queryset)

        return Response(serializer.data)
    
    def delete(self, request, id):
        queryset = self.get_object(id)
        queryset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)