from django.db import models

class Department(models.Model):
    department = models.CharField(max_length=255, help_text="Ex:Electronics&accessories")
    date_added = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.department