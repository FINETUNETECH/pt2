from django.urls import path

from .views import NewRequestViewset

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('newrequest/', NewRequestViewset.as_view()),
]