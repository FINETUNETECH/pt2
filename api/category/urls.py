from django.urls import path, include
from . import views

app_name = "api.category"

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('category/', views.CategoryList.as_view()),
]