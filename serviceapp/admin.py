from re import I
from django.contrib import admin
from .models import Contact, ScheduleCall

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    pass

@admin.register(ScheduleCall)
class ScheduleCallAdmin(admin.ModelAdmin):
    pass