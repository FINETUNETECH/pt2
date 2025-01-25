from django.db import models
from api.product.models import Product

class SpareCosting(models.Model):
    spare_costing_name = models.CharField(max_length=255, default="New costing")
    customer_profit_percentage = models.FloatField()
    dealer_profit_percentage = models.FloatField()
    service_charge = models.FloatField(help_text="All values in INR")
    dealer_standard_profit = models.FloatField(help_text="All values in INR")
    customer_standard_profit = models.FloatField(help_text="All values in INR")
    date_added = models.DateTimeField(auto_now=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.spare_costing_name
    
class Discount(models.Model):
    discount_name = models.CharField(max_length=255, default="Standard discount")
    discount = models.IntegerField(default=0)
    is_percent = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.discount_name

class Quality(models.Model):
    quality = models.CharField(max_length=155, help_text="Original quality, Duplicate etc.,")
    date_added = models.DateTimeField(auto_now=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.quality

class SpareProperty(models.Model):
    UNITS = [
        ('GB', 'Gigabytes'),
        ('MAH', 'milliampere hour'),
        ('MB', 'Megabytes'),
        ('TB', 'terabyte')
    ]
    property_name = models.CharField(max_length=155, null=True, blank=True)
    property_value = models.BigIntegerField()
    property_unit = models.CharField(max_length=5, choices=UNITS)

    def __str__(self):
        return '%s %s' % (str(self.property_value), str(self.property_unit))

class SpareVariety(models.Model):
    quality = models.ForeignKey(Quality, max_length=255, on_delete=models.CASCADE, null=True, blank=True)

    variety_name = models.CharField(max_length=255, null=True, blank=True)
    property = models.ForeignKey(SpareProperty, null=True, blank=True, on_delete=models.CASCADE)
    purchase_price = models.PositiveIntegerField(help_text="in INR", blank=True, null=True)
    retail_price = models.FloatField(help_text="All values in INR", blank=True, null=True)
    dealer_price = models.FloatField(help_text="All values in INR", blank=True, null=True)
    stock_available = models.PositiveIntegerField(blank=True, null=True,default=True)
    spare_costing = models.ForeignKey(SpareCosting, on_delete=models.CASCADE, blank=True, null=True)
    spare_discount = models.ForeignKey(Discount, on_delete=models.CASCADE, blank=True, null=True)
    is_available = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        try:
            if self.quality:
                return str(self.quality.quality)
            elif self.variety_name:
                return self.variety_name
            else:
                return '%s %s' % (str(self.property.property_value), str(self.property.property_unit))
        except:
            print(self.id)
    
    """Calculating the Retail Price and the Dealer price according to the user given formula"""
    # def calculateRetailPrice(self):
    #     retail_price = self.purchase_price + ((self.spare_costing.customer_profit_percentage/self.purchase_price)*100) + self.spare_costing.customer_standard_profit + self.spare_costing.service_charge
    #     return retail_price
    
    # def calculateDealerPrice(self):
    #     dealer_price = self.purchase_price + ((self.spare_costing.dealer_profit_percentage/self.purchase_price)*100)
    #     return dealer_price

    # def save(self, *args, **kwargs):
    #     retail_price = self.calculateRetailPrice()
    #     dealer_price = self.calculateDealerPrice()
    #     self.retail_price = retail_price
    #     self.dealer_price = dealer_price
    #     super(SpareVariety, self).save(*args, **kwargs)
class Type(models.Model):
    type = models.CharField(max_length=255, help_text="LED, LCD")
    date_added = models.DateTimeField(auto_now=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.type

class Spare(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    spare_variety = models.ManyToManyField(SpareVariety, related_name='spare_varieties', null=True, blank=True)
    name = models.CharField(max_length=255, help_text="Enter the name of spare (Ex:Display, Speakers)")
    type = models.ForeignKey(Type, blank=True, null=True, on_delete=models.CASCADE)
    date_added = models.DateTimeField(auto_now=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '%s - %s' % (self.product.name, self.name)

class History(models.Model):
    spare = models.ForeignKey(Spare, on_delete=models.CASCADE)
    quality = models.ForeignKey(Quality, max_length=255, on_delete=models.CASCADE)
    purchase_price = models.PositiveIntegerField(help_text="in INR")
    retail_price = models.FloatField(help_text="All values in INR", blank=True, null=True)
    dealer_price = models.FloatField(help_text="All values in INR", blank=True, null=True)
    stock_available = models.PositiveIntegerField(blank=True, null=True)
    spare_costing = models.ForeignKey(SpareCosting, on_delete=models.CASCADE, blank=True, null=True)
    spare_discount = models.ForeignKey(Discount, on_delete=models.CASCADE, blank=True, null=True)
    is_available = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return  '%s-%s' % (self.spare.product.name, self.quality.quality)
    