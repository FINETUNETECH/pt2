from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CategorySerializer
from .models import Category

class CategoryList(APIView):
    def get(self, request):
        queryset = Category.objects.all()
        serializer_class = CategorySerializer(queryset, many=True)
        return Response(serializer_class.data)