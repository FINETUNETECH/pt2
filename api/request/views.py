from rest_framework import viewsets, status
from .serializers import RequestSerializers
from .models import Request
from rest_framework.views import APIView
from django.db.models import Q
from rest_framework.response import Response

class NewRequestViewset(APIView):
    def get(self, request):
        queryset = Request.objects.filter(is_completed=False)
        serializer_class = RequestSerializers(queryset, many=True)

        return Response(serializer_class.data)
    
    def post(self, request):
        data = request.data
        data['user']= request.user.id
        serializer_class = RequestSerializers(data=data)
        if serializer_class.is_valid():
            serializer_class.save()

            return Response(serializer_class.data, status=status.HTTP_201_CREATED)
        else:
            print(serializer_class.errors)
            return Response({'err':"wrong data sent"}, status=status.HTTP_400_BAD_REQUEST)