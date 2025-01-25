from django.db import models

class Brand(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="brandLogo/", blank=True, null=True)
    date_added = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'api_brand'  # Explicitly set the table name
    
    def _str_(self):
        return self.name