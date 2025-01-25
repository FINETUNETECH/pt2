from django.db import models
from api.category import models as CategoryModel

class SubCategory(models.Model):
    category = models.ForeignKey(CategoryModel.Category, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name