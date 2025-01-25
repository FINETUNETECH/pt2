from django.db import models

class Maps(models.Model):
    location = models.CharField(max_length=255)
    pincode = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    
    def __str__(self):
        return self.location
    
    class Meta:
        verbose_name_plural = "Locations"