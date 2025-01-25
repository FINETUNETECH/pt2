from asyncio import ReadTransport as read
from shutil import register_unpack_format
from django.forms import ChoiceField
from rest_framework import serializers

from api.product.serializers import ProductSerializers
from user.serializers import UserSerializer
from .models import Bookings, CustomerResponse,Issue, BookingDetails, Questions, OtherIssue
from api.brand.serializers import BrandSerializers
from api.spares.serializers import SpareOnlySerializer, SpareVarietySerializer

class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['id','issue_name', 'date_created',]
        
class OtherIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherIssue
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    # order_status = ChoiceField(choices=Bookings.ORDER_STATUS)
    # order_status = serializers.CharField(source='order_status_display')
    order_status = serializers.SerializerMethodField()
    assignee = serializers.SerializerMethodField()
    class Meta:
        model = Bookings
        fields = ['pk','assignee','orderId','store','attendant','alternate_mobile','remark','order_status','name','mobile','pincode','order_priority','is_verified','email','enq_or_cus','address_line_1','address_line_2','booking_date','date_created', 'date_modified',]

    def get_order_status(self,obj):
        return obj.get_order_status_display()
    
    def get_assignee(self, obj):
        if obj.assignee:
            if(obj.assignee.name != 'Anonymous'):
                return obj.assignee.name
            else:
                return obj.assignee.phone
        
class BookingDetailSerializer(serializers.ModelSerializer):
    # brands = BrandSerializers(many=False, read_only=False)
    # products = ProductSerializers(many=False, read_only=False)
    booking_for = BookingSerializer(many=False, read_only=False)
    issue = IssueSerializer(many=True, read_only=False)
    selected_spare = SpareVarietySerializer(many=True)
    other_issue = OtherIssueSerializer(many=True)

    class Meta:
        model = BookingDetails
        booking_for = BookingSerializer(many=False, read_only=False)
        fields = ['id','booking_for', 'brands','products', 'mobile_pin','service_charge','is_charger_cc_board','total_payment','advance_payment', 'selected_spare','brand_alter','product_alter','issue', 'other_issue','date_created',]

class FullBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookings
        fields = ['pk','orderId','order_status','name','mobile','alternate_mobile','assignee','remark','pincode','is_verified','email','enq_or_cus','address_line_1','address_line_2','booking_date',]

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Questions
        fields = ['id','question_set_name','question',]

class CustomerResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerResponse
        fields = ['id','booking','question','response']

class BookingDetailModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingDetails
        booking_for = BookingSerializer(many=False, read_only=False)
        fields = ['id','booking_for', 'brands','products', 'mobile_pin', 'other_issue','service_charge','is_charger_cc_board', 'selected_spare','brand_alter','product_alter','issue','advance_payment','total_payment', 'date_created',]
        
class UpdateBookingWithDetailSerializer(serializers.ModelSerializer):
    booking_for = BookingSerializer(many=False, read_only=False)
    issue = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.all(), many=True)
    class Meta:
        model = BookingDetails
        booking_for = BookingSerializer(many=False, read_only=False)
        fields = ['id','booking_for','total_payment', 'brands','products', 'mobile_pin', 'selected_spare','brand_alter','service_charge','is_charger_cc_board','product_alter','other_issue', 'issue', 'date_created',]

class GraphDataSerializer(serializers.ModelSerializer):
    booking_for = BookingSerializer(many=False, read_only=False)
    
    class Meta:
        model = BookingDetails
        booking_for = BookingSerializer(many=False, read_only=False)
        fields = '__all__'