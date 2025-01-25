from functools import partial
import json
from django.shortcuts import render
from rest_framework.views import APIView

from user.models import CustomUser
from .models import StoreStaff, Stores
from rest_framework.response import Response
from rest_framework import status
from .serializers import StoreListSerializer, StoreSerializer, StoreStaffSerializer
from django.contrib.auth.models import Group, Permission

def saveStaff(staff_list, store):
    # getting all staff of the store
    all_store = StoreStaff.objects.filter(store=store)
    if all_store:
        for stores in all_store:
            stores.store = None
            stores.save()
    for staff in staff_list:
        get_staff_user = CustomUser.objects.get(id=staff)

        if StoreStaff.objects.filter(staff__id = staff).exists():
            get_store_staff = StoreStaff.objects.get(staff__id = staff)
            get_store_staff.store = store
            get_store_staff.save()
        else:
            newstaff = StoreStaff.objects.create(store=store,staff=get_staff_user)
            newstaff.save()

class StoreDetialView(APIView):
    def get_store(self, id):
        try:
            return Stores.objects.get(id=id)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def get(self,request, id):
        queryset = self.get_store(id)
        serializer_class = StoreSerializer(queryset, many=False)

        return Response(serializer_class.data)
    
    def put(self, request, id):
        queryset = self.get_store(id)
        data = request.data
        staff_list = data['staff']
        del data['staff']
        # getting Manager user
        # Getting the manager
        
        manager_mobile = data['manager'].split('|', 1)[1].replace(" ", "")

        manager_user = CustomUser.objects.get(phone=manager_mobile)
        data['manager'] = manager_user.id

        if queryset.manager.id != manager_user.id:
            # changing the manager user permission to manager
            old_manager = CustomUser.objects.get(id=queryset.manager.id)
            manager_permission = Group.objects.get(name__iexact ='Manager')
            old_manager.groups.remove(manager_permission.id)
            
            # new manager
            manager_permission = Group.objects.get(name__iexact ='Manager')
            manager_user.groups.add(manager_permission.id)


        serializer_class = StoreListSerializer(queryset, data=data, partial=True)
        if serializer_class.is_valid():
            store = serializer_class.save()

            # check for staff obj and save new staff if not available
            saveStaff(staff_list, store)

        else:
            print(serializer_class.errors)
        return Response(serializer_class.data)
    
    def delete(self, request, id):
        snippet = self.get_store(id)
        snippet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        
# Have to work on this
class StoreStaffList(APIView):
    def get_store(self, id):
        try:
            return StoreStaff.objects.filter(store__id=id)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def get(self,request, store_id):
        queryset = self.get_store(store_id)
        serializer_class = StoreStaffSerializer(queryset, many=True)

        return Response(serializer_class.data)

class StoresList(APIView):
    def get_store(self):
        try:
            return Stores.objects.all()
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def get(self, request):
        stores = self.get_store()
        serializer = StoreListSerializer(stores, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        data = request.data
        serializer_class = StoreListSerializer(data=data)
        staff_list = data['staff']
        del data['staff']

        # Getting the manager
        
        manager_mobile = data['manager'].split('|', 1)[1].replace(" ", "")
        try:
            manager_object = CustomUser.objects.get(phone=manager_mobile)
            data['manager'] = manager_object.id
        except:
            return Response({'error': 'No manager user found!'},status=status.HTTP_404_NOT_FOUND)
        
        #Check If he is manager for another store and remove it
        if Stores.objects.filter(manager=manager_object.id).exists():
            manager_store = Stores.objects.get(manager=manager_object.id)
            manager_store.manager = None
            manager_store.save()

        if serializer_class.is_valid():
            newStore = serializer_class.save()

            # changing the manager user permission to manager
            manager_permission = Group.objects.get(name__iexact ='Manager')
            manager_object.groups.add(manager_permission.id)
            store_id = newStore.id
            if manager_object.name != 'Anonymous':
                return_data = {'manager_detail': manager_object.name}
            else:
                return_data = {'manager_detail': manager_object.phone}
            return_data.update(serializer_class.data)
            
            # check for staff obj and save new staff if not available
            saveStaff(staff_list, newStore)

        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(return_data, status=status.HTTP_200_OK)