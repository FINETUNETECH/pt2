from django.contrib.auth.models import Group
from functools import partial
from http.client import NOT_FOUND
import json
from typing import OrderedDict
from django.shortcuts import get_object_or_404, render
from rest_framework.response import Response

from api.brand.models import Brand
from api.product.models import Product
from .serializers import BookingDetailModelSerializer, BookingSerializer, CustomerResponseSerializer, FullBookingSerializer,IssueSerializer, BookingDetailSerializer, QuestionSerializer, UpdateBookingWithDetailSerializer,GraphDataSerializer, OtherIssueSerializer
from rest_framework import viewsets
from rest_framework.views import APIView
from .models import Bookings, CustomerResponse, Issue, BookingDetails, Questions, OtherIssue
from django.db.models import Q
from rest_framework import status
import random
import string
from django.utils import timezone
from datetime import datetime

from api.bookings import serializers

class BookingList(APIView):
    def get(self, request):
        enq_or_cus = request.GET.get('eo', None)
        store = request.GET.get('store', None)
        
        if enq_or_cus == 'null':
            enq_or_cus = None
        if store == 'null':
            store = None
        start_date = request.GET.get('start_date', '')
        end_date = request.GET.get('end_date', '')
        filter = request.GET.get('filter', False)

        if start_date and end_date:
            filter_start = datetime.strptime(start_date, '%d-%m-%Y')
            filter_end = datetime.strptime(end_date,'%d-%m-%Y')
            tz = timezone.get_current_timezone()
            start_date_with_tz= timezone.make_aware(filter_start, tz, True)
            end_date_with_tz= timezone.make_aware(filter_end, tz, True)
        
        if not filter and enq_or_cus:
            queryset = Bookings.objects.filter(enq_or_cus__iexact=enq_or_cus).order_by('date_created')
        elif filter:
            if enq_or_cus and end_date and store:
                queryset = Bookings.objects.filter(Q(enq_or_cus__iexact=enq_or_cus) & Q(booking_date__range=[start_date_with_tz,end_date_with_tz]) & Q(store__store_name__iexact =store )).order_by('date_created')
            elif enq_or_cus and end_date:
                queryset = Bookings.objects.filter(Q(enq_or_cus__iexact=enq_or_cus) & Q(booking_date__range=[start_date_with_tz,end_date_with_tz])).order_by('date_created')
            if end_date and store:
                queryset = Bookings.objects.filter(Q(booking_date__range=[start_date_with_tz,end_date_with_tz])& Q(store__store_name__iexact=store)).order_by('date_created')
            if enq_or_cus and store:
                queryset = Bookings.objects.filter(Q(enq_or_cus__iexact=enq_or_cus) & Q(store__store_name__iexact=store)).order_by('date_created')
            elif enq_or_cus:
                queryset = Bookings.objects.filter(Q(enq_or_cus__iexact=enq_or_cus)).order_by('date_created')
            elif store:
                queryset = Bookings.objects.filter(store__store_name__iexact=store).order_by('date_created')
            else:
                queryset = Bookings.objects.filter(Q(booking_date__range=[start_date_with_tz,end_date_with_tz])).order_by('date_created')
        else:
            queryset = Bookings.objects.all().order_by('date_created')
        serializer_class = BookingSerializer(queryset, many=True)
        return Response(serializer_class.data)

    def post(self, request):
        data = request.data

        # Generating random Order id for the orders
        if data['enq_or_cus'] == 'CUS':
            attendant = request.user
            check_manager = Group.objects.get(name__iexact='manager')
            if check_manager in attendant.groups.all():
                store = attendant.stores
                data['store'] = store.id
                data['attendant']=attendant.id
            else:
                store = attendant.store_staff.store
                data['store'] = store.id
                data['attendant']=attendant.id

            orderId = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(8))
            while Bookings.objects.filter(orderId = orderId).exists():
                orderId = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(8))
            
            data['orderId'] = orderId
        # try:
            serializer_class = BookingSerializer(data=data, partial=True) 
            if serializer_class.is_valid():
                serializer_class.save()
                # getting questions
                get_questions = Questions.objects.filter(question_set_name__iexact='QC')
                get_booking = Bookings.objects.get(pk = serializer_class.data['pk']) 
                
                for question in get_questions:
                    response_question = CustomerResponse.objects.create(booking=get_booking, question_set_name='QC', question=question.question)
                    response_question.save()

                return Response(serializer_class.data, status=status.HTTP_201_CREATED)
            else:
                
                return Response(serializer_class.data, status=status.HTTP_400_BAD_REQUEST)

        elif data['enq_or_cus'] == 'ENQ':
            attendant = request.user
            check_manager = Group.objects.get(name__iexact='manager')
            if check_manager in attendant.groups.all():
                store = attendant.stores
                data['store'] = store.id
                data['attendant']=attendant.id
            else:
                store = attendant.store_staff.store
                data['store'] = store.id
                data['attendant']=attendant.id

            orderId = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(8))
            while Bookings.objects.filter(orderId = orderId).exists():
                orderId = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(8))
            
            data['orderId'] = orderId
        # try:
            serializer_class = BookingSerializer(data=data, partial=True) 
            if serializer_class.is_valid():
                serializer_class.save()

                return Response(serializer_class.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer_class.data, status=status.HTTP_400_BAD_REQUEST)
                
        # except:
        #     return Response(serializer_class.errors)

# This has only Pk in foreign Key Relation
class GetBookingDetailList(APIView):
    def get(self, request):
        filter = request.GET.get('filter', None)
        start_date = request.GET.get('start_date', '')
        end_date = request.GET.get('end_date', '')

        if filter:
            filter_start = datetime.strptime(start_date, '%d-%m-%Y')
            filter_end = datetime.strptime(end_date,'%d-%m-%Y')
            tz = timezone.get_current_timezone()
            start_date_with_tz= timezone.make_aware(filter_start, tz, True)
            end_date_with_tz= timezone.make_aware(filter_end, tz, True)

            queryset = BookingDetails.objects.filter(Q(date_created__range=[start_date_with_tz,end_date_with_tz])).order_by('date_created')
        else:
            queryset = BookingDetails.objects.all()
        serializer_class = BookingDetailModelSerializer(queryset, many=True)
        return Response(serializer_class.data)
    
    def post(self, request):
        data = request.data

        # # changing issue to its id
        issue = []
        for each_issue in data['issue']:
            get_issue = Issue.objects.get(issue_name=each_issue)
            issue.append(get_issue.id)
            
        data['issue'] = issue
        data['other_issue'] = []

        # Checking brand existance if not saving as a plain text
        if Brand.objects.filter(name__iexact=data['brand']).exists():
            get_brand = Brand.objects.get(name__iexact=data['brand']).name
            data['brands'] = get_brand
        else:
            data['brands'] = data['brand']

         # Checking product existance if not saving as a plain text
        if Product.objects.filter(model_no__iexact=data['products']).exists():
            get_product = Product.objects.get(model_no__iexact=data['products'])
            data['products'] = f'{get_product.name}|{get_product.model_no}'
        else:
            data['products'] = data['products']
        
        # check other issue
        if len(data['other_issue']):
            if OtherIssue.objects.filter(Q(product__iexact=data['products']) & Q(other_issue = data['other_issue'])).exists():
                data['other_issue'].append(OtherIssue.objects.get(Q(product__iexact=data['products']) & Q(other_issue = data['other_issue'])).id)
            else:
                new_other_issue = OtherIssue.objects.create(product=data['products'], other_issue=data['other_issue'], other_issue_value=data['other_issue_val'])
                new_other_issue.save()
                data['other_issue'].append(new_other_issue.id)

        try:
            serializer_class = BookingDetailModelSerializer(data=data, partial=True) 
            if serializer_class.is_valid():
                serializer_class.save()
                return Response(serializer_class.data, status=status.HTTP_201_CREATED)
            else:
                print(serializer_class.errors)
                
                return Response(serializer_class.data, status=status.HTTP_400_BAD_REQUEST)
        except:
            print(serializer_class.errors)
            return Response(serializer_class.errors)

class OtherIssueView(APIView):
    def get(self, request):
        product = request.GET.get('product', None)
        other_issue = request.GET.get('other_issue', None)
        if product is not None and other_issue is not None:
            queryset = OtherIssue.objects.filter(other_issue__iexact = other_issue, product=product)
        else:
            queryset = OtherIssue.objects.all()
        serializer_class = OtherIssueSerializer(queryset, many=True)
        return Response(serializer_class.data)

class BookingDetail(APIView):
    def get(self, request, pk):
        queryset = get_object_or_404(Bookings, pk=pk)
        serializer_class = FullBookingSerializer(queryset, many=False)
        return Response(serializer_class.data)

    def put(self, request, pk):
        booking_object = get_object_or_404(Bookings, pk=pk)
        data= request.data
        
        if Brand.objects.filter(name__iexact=data['brands']).exists():
            get_brand = Brand.objects.get(name__iexact=data['brands']).id
            data['brands'] = get_brand
            data['brand_alter'] = ''
        else:
            data['brand_alter'] = data['brands']
            data['brands'] = None

         # Checking product existance if not saving as a plain text
        if Product.objects.filter(model_no__iexact=data['products']).exists():
            get_product = Product.objects.get(model_no__iexact=data['products']).id
            data['products'] = get_product
            data['product_alter'] = ''
        else:
            data['product_alter'] = data['products']
            data['products']= None

        serializer_class = BookingSerializer(booking_object, data = request.data)
        if serializer_class.is_valid():
            serializer_class.save()

            return Response(serializer_class.data, status= status.HTTP_200_OK)
        else:
            return Response(serializer_class.data, status= status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            booking_object = get_object_or_404(Bookings, pk=pk)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)
        booking_object.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class IssueList(APIView):
    def get(self, request):
        queryset = Issue.objects.all()
        serializer_class = IssueSerializer(queryset, many=True)
        return Response(serializer_class.data)

class OrderList(APIView):
    def get(self, request):
        qs = Bookings.objects.filter(enq_or_cus='CUS').order_by('-booking_date')
        serializer_class = BookingSerializer(qs, many=True)
        return Response(serializer_class.data)

class BookingsFirstQuestionList(APIView):
    def get(self, request):
        qs = Questions.objects.filter(question_set_name__iexact = 'MD')
        serializer_class = QuestionSerializer(qs, many=True)
        return Response(serializer_class.data)

class QuestionSetDetail(APIView):
    def get(self, request, question_set):
        qs = Questions.objects.filter(question_set_name__iexact = question_set)
        serializer_class = QuestionSerializer(qs, many=True)
        return Response(serializer_class.data)
    
class AllQuestions(APIView):
    def get(self, request):
        qs = Questions.objects.all()
        serializer_class = QuestionSerializer(qs, many=True)
        return Response(serializer_class.data)

    def post(self, request):
        data = request.data
        serializer_class = QuestionSerializer(data=data)

        if serializer_class.is_valid():
            serializer_class.save()
        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer_class.data)

class EditQuestion(APIView):
    def put(self, request, id):
        data = request.data
        
        get_question = Questions.objects.get(id = id)

        serializer_class = QuestionSerializer(get_question, data=data ,partial=True)
                            
        if serializer_class.is_valid():
            serializer_class.save()
        else:
            return Response( status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer_class.data)

    def delete(self, request, id):
        booking = Questions.objects.get(id = id)
        booking.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
        
class CustomerResponseList(APIView):
    def get(self, request):
        qs = CustomerResponse.objects.all()
        serializer_class = CustomerResponseSerializer(qs, many=True)
        return Response(serializer_class.data)
    
    def post(self, request):
        data = request.data

        # Getting question and responses separately
        try:
            question_and_responses = {}
            for question in data['questions']:
                for key, value in question.items():
                    question_and_responses.update({
                        'booking': data['booking'],
                        'question': key,
                        'response': value
                    })

            
                    serializer_class = CustomerResponseSerializer(data=question_and_responses) 
                    if serializer_class.is_valid():
                        serializer_class.save()
            return Response(serializer_class.data)
                   
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class EachCustomerResponseList(APIView):
    def get(self, request, pk):
        qs = CustomerResponse.objects.filter(Q(booking__id=pk) & Q(question_set_name = None))
        serializer_class = CustomerResponseSerializer(qs, many=True)
        return Response(serializer_class.data)

class ResponseQuestionList(APIView):
    def get(self, request):
        question_set = request.GET.get('qs')
        booking_id = request.GET.get('id')
        qs = CustomerResponse.objects.filter(Q(booking__id=booking_id) & Q(question_set_name__iexact=question_set))
        serializer_class = CustomerResponseSerializer(qs, many=True)
        return Response(serializer_class.data)
    
    def put(self, request):
        data = request.data
        for each in data:
            get_response = CustomerResponse.objects.get(id = each['id'])
            get_response.response = each['response']
            get_response.save()

        # serializer_class = CustomerResponseSerializer(qs, many=True)
        return Response(status=status.HTTP_201_CREATED)

class FullBookingDetailsView(APIView):
    def get(self, request, pk):
        bookings = Bookings.objects.get(pk = pk)
        qs = bookings.bookingdetails
        serializer_class = BookingDetailSerializer(qs, many=False)
        return Response(serializer_class.data)
    
    def put(self, request, pk):
        return Response(status=status.HTTP_200_OK)

    def delete(self, request, pk):
        booking = Bookings.objects.get(pk = pk)
        booking.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

class UpdateBookingWithDetail(APIView):
    def get(self, request, pk):
        bookings = Bookings.objects.get(pk = pk)
        qs = bookings.bookingdetails
        serializer_class = UpdateBookingWithDetailSerializer(qs, many=False)
        return Response(serializer_class.data)
        
    def put(self, request, pk):
        data = request.data
        bookings = Bookings.objects.get(pk = pk)
        qs = bookings.bookingdetails
        # getting Brand
        get_brand = Brand.objects.get(name=data['brand']).id
        data['brand'] = get_brand
        try:
            get_product = Product.objects.get(model_no__iexact=data['model_no']).id

            data['model_no'] = get_product
        except:
            get_product = data['model_no']
            data['model_no'] = get_product
        get_issues = []
        # selected_spare = []

        for issue in data['issue']:
            get_issue_obj = Issue.objects.get(issue_name__contains=issue).id
            get_issues.append(get_issue_obj)

        # check other issue
        if len(data['other_issue']):
            other_issues = data.pop('other_issue')
            data['other_issue'] = []
            for issues in other_issues:
                if OtherIssue.objects.filter(Q(product__iexact=data['product']) & Q(other_issue = issues['other_issue'])).exists():
                    get_issue= OtherIssue.objects.get(Q(product__iexact=data['product']) & Q(other_issue = issues['other_issue']))
                    get_issue.other_issue_value = issues['other_issue_value']
                    get_issue.save()
                    data['other_issue'].append(get_issue.id)
                else:
                    new_other_issue = OtherIssue.objects.create(product=data['product'], other_issue=issues['other_issue'], other_issue_value=issues['other_issue_value'])
                    new_other_issue.save()
                    data['other_issue'].append(new_other_issue.id)

        # saving selected spare
        # selected_spare.append(data['selected_spare'])
        
        del data['issue']
        data['issue'] = get_issues

        # booking_data = {}
        # booking_data['mobile'] = data['mobile']

        serializer_class = UpdateBookingWithDetailSerializer(qs, data=data ,partial=True)
        
        if serializer_class.is_valid():
            serializer_class.save()
        else:
            pass
        
        return Response(status=status.HTTP_200_OK)

# This has only Pk in foreign Key Relation
class UpdateBookingDetails(APIView):
    def getBooking(self, id):
        brand = get_object_or_404(Bookings, id= id)
        return brand

    def get(self, request, order_id):
        queryset = self.getBooking(order_id)
        serializer_class = FullBookingSerializer(queryset, many=False)
        return Response(serializer_class.data)
    
    def put(self, request, id):
        queryset = self.getBooking(id)
        data = request.data
        data['assignee'] = request.user.id

        
        if 'is_verified' in data:
            if data['is_verified']:
                data['order_status'] = 'CB'

        serializer_class = FullBookingSerializer(queryset, data=data, partial=True)
        
        
        
            
        if serializer_class.is_valid():
            serializer_class.save()
        else:
            Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer_class.data, status=status.HTTP_201_CREATED)

class GraphData(APIView):
    def get(self, request):
        # start_date = datetime.date.today()
        # end_date = datetime.date.today()
        
        # if start_date.day > 25:
        #     end_date += datetime.timedelta(7)

        # filter_start = datetime.strptime(start_date, '%d-%m-%Y')
        # filter_end = datetime.strptime(end_date,'%d-%m-%Y')
        # tz = timezone.get_current_timezone()
        # start_date_with_tz= timezone.make_aware(filter_start, tz, True)
        # end_date_with_tz= timezone.make_aware(filter_end, tz, True)

        qs = BookingDetails.objects.filter(booking_for__order_status = 'OC')
        serializer_class = GraphDataSerializer(qs, many=True)
        return Response(serializer_class.data)