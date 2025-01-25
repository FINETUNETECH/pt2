from django.db import models
from api.product import models as productModel
from api.units.models import Unit

class Property(models.Model):
    property_name = models.CharField(max_length=255, help_text="RAM, HDD")
    property_value = models.CharField(max_length=255, help_text="6GB, 4000mah")
    property_unit = models.ForeignKey(Unit, on_delete=models.CASCADE)

    def __str__(self):
        return '%s %s %s' % (self.property_name, self.property_value, self.property_unit.unit)

class Variant(models.Model):
    product = models.ForeignKey(productModel.Product, on_delete=models.CASCADE)
    variant_name = models.CharField(max_length=255, help_text="Enter model name Ex:6GB RAM, 128GB ROM")
    property = models.ManyToManyField(Property, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.product.name