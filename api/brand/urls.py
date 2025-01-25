from . import views
from django.urls import path


app_name = "api.brand"

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('brands/', views.BrandList.as_view()),
    path('brands/<str:name>/', views.BrandDetail.as_view()),
]