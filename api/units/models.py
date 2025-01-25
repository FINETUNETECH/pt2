from django.db import models

class Unit(models.Model):
    unit = models.CharField(max_length=255)
    date_added = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.unit