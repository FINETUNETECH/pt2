from django.db import models
from api import department
from api.department.models import Department

class Category(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    date_added = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name