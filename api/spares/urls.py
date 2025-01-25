from django.urls import path

from .views import *


app_name = "spares"

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('spares/', spareList.as_view()),
    path('qualities/', qualityList.as_view()),
    path('qualities/<int:pk>/', qualityDetailView.as_view()),
    path('sparecostings/', SpareCostingMethodList.as_view()),
    path('spares/<str:product>/', SpareDetail.as_view()),
    path('sparesdetail/<int:id>/', SpareDetailViewSet.as_view()),
    path('searchspare/', SearchSpare.as_view()),
    path('getprice/<str:product>/<str:issue>/', GetPrice.as_view()),
]