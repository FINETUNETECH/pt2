from . import views
from django.urls import path


app_name = "user"

# app_name will help us do a reverse look-up latter.
urlpatterns = [
    path('notifications/', views.UserNotificationList.as_view()),
    path('notifications/<int:id>/', views.UserNotificationDetail.as_view()),
    path('users/', views.UserList.as_view()),
    path('users/<int:id>/', views.UserDetail.as_view()),
    path('change_password/<int:pk>/', views.ChangePasswordView.as_view(), name='auth_change_password'),
]