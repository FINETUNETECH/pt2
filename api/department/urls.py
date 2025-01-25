from django.urls import path, include
from . import views

app_name = "api.department"

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('department/', views.DepartmentList.as_view()),
]
