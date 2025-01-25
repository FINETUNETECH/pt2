from .models import Brand
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import BrandSerializers

# ViewSets define the view behavior.
class BrandList(APIView):
    def get(self, request):
        queryset = Brand.objects.all()
        serializer_class = BrandSerializers(queryset, many=True)
        return Response(serializer_class.data)

class BrandDetail(APIView):
    def get(self,request, name):
        queryset = Brand.objects.get(name__iexact=name)
        serializer_class = BrandSerializers(queryset, many=False)
        return Response(serializer_class.data)