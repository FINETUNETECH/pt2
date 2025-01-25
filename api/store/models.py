
from django.db import models
from user.models import CustomUser

class Stores(models.Model):
    manager = models.OneToOneField(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    store_id = models.UUIDField(null=True,blank=True)
    store_name = models.CharField(max_length=255)
    store_address = models.TextField(max_length=1025, null=True, blank=True)
    lat = models.FloatField(null=True)
    lon = models.FloatField(null=True)
    date_added = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.store_name

class StoreStaff(models.Model):
    store = models.ForeignKey(Stores, on_delete=models.CASCADE, blank=True, null=True)
    staff = models.OneToOneField(CustomUser, on_delete=models.CASCADE, blank=True, related_name="store_staff")
    date_added = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        if self.store and self.staff:
            return '%s - %s' % (str(self.store.store_name), str(self.staff.phone))
        elif self.store:
            return '%s' % (str(self.store.store_name))
        else:
            return '%s' % (str(self.staff.phone))