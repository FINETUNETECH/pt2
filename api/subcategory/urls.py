from . import views
from django.urls import path


app_name = "subcategory"

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('subcategory/', views.SubcategoryList.as_view()),
]