from serviceapp.views import dashboard
from .models import CustomUser, UserNotifications
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404
from rest_framework import status
import json
from .serializers import NotificationSerializer, UserSerializer, ChangePasswordSerializer
from rest_framework.permissions import IsAuthenticated

from user import serializers

class UserNotificationList(APIView):
    def get(self, request):
        queryset = UserNotifications.objects.filter(user = request.user).order_by('-date_created')
        serializer_class = NotificationSerializer(queryset, many=True)

        return Response(serializer_class.data)

class UserNotificationDetail(APIView):
    def post(self, request, id):
        notification = UserNotifications.objects.get(id=id)
        serializer = NotificationSerializer(notification, data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetail(APIView):
    def get_object(self, pk):
        try:
            return CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            raise Http404

    def get(self, request, id):
        queryset = CustomUser.objects.get(id=id)
        serializer_class = UserSerializer(queryset, many=False)
        return Response(serializer_class.data)

    def put(self, request, id, format=None):
        user = self.get_object(id)
        data = json.loads(request.body)
        # if mobile number changed, have to check that number is already registered or not
        serializer = UserSerializer(user, data=data[0],partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, id, format=None):
        snippet = self.get_object(id)
        snippet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserList(APIView):
    def get(self,request):
        qs = CustomUser.objects.all()
        serializer = UserSerializer(qs, many=True)
        return Response(serializer.data)

class ChangePasswordView(generics.UpdateAPIView):

    model = CustomUser
    serializer_class = ChangePasswordSerializer
    permission_classes = (IsAuthenticated,)

    def update(self, request, *args, **kwargs):
        # get user
        id= kwargs['pk']
        user_obj = CustomUser.objects.get(id = id)
        data = json.loads(request.body)[0]
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            # set_password also hashes the password that the user will get
            user_obj.set_password(data['password'])
            user_obj.save()
            return Response(serializer.data)

        return Response(status=status.HTTP_400_BAD_REQUEST)