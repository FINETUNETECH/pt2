from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Department
from .serializers import DepartmentSerializer

class DepartmentList(APIView):
    def get(self, request):
        queryset = Department.objects.all()
        serializer_class = DepartmentSerializer(queryset, many=True)
        return Response(serializer_class.data)
