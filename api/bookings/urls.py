from rest_framework import routers, serializers, viewsets
from django.urls import path, include
from . import views

urlpatterns = [
    path('bookings/', views.BookingList.as_view()),
    path('bookingdetails/', views.GetBookingDetailList.as_view()),
    path('issuelist/', views.IssueList.as_view()),
    path('bookingdetail/<int:pk>/', views.FullBookingDetailsView.as_view()),
    path('updatebooking/<int:pk>/', views.UpdateBookingWithDetail.as_view()),
    path('orders/', views.OrderList.as_view()),
    path('firststagebookingquestions/', views.BookingsFirstQuestionList.as_view()),
    path('customerresponses/', views.CustomerResponseList.as_view()),
    path('eachcustomerresponses/<int:pk>/', views.EachCustomerResponseList.as_view()),
    path('bookingstatus/updates/<int:id>/', views.UpdateBookingDetails.as_view()),
    path('filter_ques/', views.ResponseQuestionList.as_view()),
    path('question/detail/<str:question_set>/', views.QuestionSetDetail.as_view()),
    path('question/edit/<int:id>/', views.EditQuestion.as_view()),
    path('questions/', views.AllQuestions.as_view()),
    path('graph_data/', views.GraphData.as_view()),
    path('other_issue/', views.OtherIssueView.as_view()),
]