from django.db import models

from serviceapp.views import contact

# Create your models here.
class Contact(models.Model):
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=10)
    
    def __str__(self):
        return self.name