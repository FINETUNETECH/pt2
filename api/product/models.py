from enum import unique
from django.db import models
from api import subcategory
from api.subcategory import models as SubcategoryModel
from api.brand.models import Brand

class Product(models.Model):
    subcategory = models.ForeignKey(SubcategoryModel.SubCategory, on_delete=models.CASCADE)
    product_id = models.CharField(max_length=255,null=True, blank=True, unique=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    name = models.CharField(max_length=255, help_text="Ex:Note 6 Pro", null=True, blank=True)
    release_year = models.PositiveIntegerField(null=True, blank=True)
    model_no = models.CharField(max_length=455, unique=True)
    date_created = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return '%s - %s' % (self.brand.name ,self.name) 