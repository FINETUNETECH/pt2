from django.urls import path, include
from . import views

app_name = "api.product"

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('productlist/', views.ProductList.as_view()),
    path('productdetail/<str:model>/<str:brand>/', views.ProductDetail.as_view()),
    path('productdetail/', views.ProductDetailViewset.as_view()),
    path('products/', views.ProductBatteryAndChargerPort.as_view())
]