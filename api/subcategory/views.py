from .models import SubCategory
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import SubcategorySerializer

class SubcategoryList(APIView):
    def get(self, request):
        queryset = SubCategory.objects.all()
        serializer_class = SubcategorySerializer(queryset, many=True)

        return Response(serializer_class.data)