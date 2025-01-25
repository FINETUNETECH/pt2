from django.urls import path
from . import views

urlpatterns = [
    path('stores/<int:id>/', views.StoreDetialView.as_view()),
    path('staff/<int:store_id>/', views.StoreDetialView.as_view()),
    path('store/staff/<int:store_id>/', views.StoreStaffList.as_view()),
    path('stores/', views.StoresList.as_view()),
]
