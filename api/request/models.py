from email.policy import default
from api.product.models import Product
from django.db import models
from user.models import CustomUser

class Request(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    brand = models.CharField(max_length=255)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, blank=True, null=True)
    model = models.CharField(max_length=455, blank=True, null=True) #Name of the product like Note 6 pro
    model_no = models.CharField(max_length=455, blank=True, null=True)
    issue = models.CharField(max_length=455)
    note = models.TextField(max_length=950, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '%s %s' % (self.brand, self.model)