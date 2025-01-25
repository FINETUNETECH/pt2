from secrets import choice
from django.db import models
from api.brand.models import Brand
from api.product.models import Product
from api.spares.models import SpareVariety
from user.models import CustomUser
from api.store.models import Stores

class Issue(models.Model):
    issue_name = models.CharField(max_length=255)
    date_created = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.issue_name

QUESTION_SET_NAME = [
    ('MD', 'Mobile Damage Check'),
    ('QC', 'Qc Questions')
]

class Bookings(models.Model):
    ENQ_OR_CUST = [
        ("ENQ", "Enquiry"),
        ("CUS", "Customer")
    ]
    ORDER_STATUS = [
        ('BO', 'Bookings'),
        ('CB', 'Confirmed Orders'),
        ('IP', 'In Progress'),
        ('QC', 'Ready for QC'),
        ('DD', 'Delivery'),
        ('OC', 'Order Completed')
    ]
    store = models.ForeignKey(Stores, on_delete=models.SET_NULL, blank=True, null=True)
    attendant = models.ForeignKey(CustomUser,  on_delete=models.SET_NULL, blank=True, null=True, related_name="attendant")
    assignee = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, blank=True, null=True)
    orderId = models.CharField(max_length=255, unique=True, null=True, blank=True)
    order_priority = models.PositiveIntegerField(default=5)
    name = models.CharField(max_length=255, verbose_name="Enter the name")
    mobile = models.CharField(max_length=10)
    alternate_mobile = models.CharField(max_length=10)
    
    pincode = models.PositiveIntegerField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    enq_or_cus = models.CharField(choices=ENQ_OR_CUST, max_length=3,default="ENQ")
    email = models.EmailField(max_length=255, null=True, blank=True)
    address_line_1 = models.TextField(max_length=1655, null=True, blank=True)
    address_line_2 = models.TextField(max_length=1655, null=True, blank=True)
   
    order_status = models.CharField(max_length=2, choices=ORDER_STATUS, default='BO')
    remark = models.TextField(max_length=455, null=True, blank=True)

    date_created = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)
    booking_date = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Bookings"

    def __str__(self):
        return self.name

class OtherIssue(models.Model):
    other_issue = models.CharField(max_length=455)
    product = models.CharField(max_length=255, null=True, blank=True)
    other_issue_value = models.DecimalField(default=0, decimal_places=2, max_digits=255)

    def __str__(self):
        return '%s - %s' % (self.other_issue, self.other_issue_value)

class BookingDetails(models.Model):
    booking_for = models.OneToOneField(Bookings, on_delete=models.CASCADE, related_name="bookingdetails")
    brands = models.CharField(max_length=255, null=True, blank=True)
    products = models.CharField(max_length=255, null=True, blank=True)
    selected_spare = models.ManyToManyField(SpareVariety, blank=True)
    issue = models.ManyToManyField(Issue, blank=True)
    other_issue = models.ManyToManyField(OtherIssue, blank=True)
    service_charge = models.BooleanField(default=False)
    is_charger_cc_board = models.BooleanField(default=False)
    mobile_pin = models.CharField(max_length=255, null=True, blank=True)
    advance_payment = models.DecimalField(default=0, decimal_places=2, max_digits=255)
    total_payment = models.DecimalField(default=0, decimal_places=2, max_digits=255)
    brand_alter = models.CharField(max_length=255, null=True, blank=True)
    product_alter = models.CharField(max_length=255, null=True, blank=True)
    date_created = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.booking_for.name
    
    class Meta:
        verbose_name_plural = "Booking Details"

class Questions(models.Model):
    question_set_name = models.CharField(choices=QUESTION_SET_NAME,  max_length=5)
    question = models.CharField(max_length=655)

    def __str__(self):
        return self.question

class CustomerResponse(models.Model):
    booking = models.ForeignKey(Bookings, on_delete=models.CASCADE)
    question_set_name = models.CharField(max_length=5, null=True, blank=True)
    question = models.CharField(max_length=655)
    response = models.CharField(max_length=655, null=True, blank=True)

    def __str__(self):
        return self.question