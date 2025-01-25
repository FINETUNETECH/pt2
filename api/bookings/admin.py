from django.contrib import admin
from .models import Bookings, Issue, Questions, CustomerResponse, BookingDetails, OtherIssue

class SpareInline(admin.TabularInline):
    model = BookingDetails.selected_spare.through

@admin.register(BookingDetails)
class BookingDetailsAdmin(admin.ModelAdmin):
    inlines= (SpareInline,)

@admin.register(OtherIssue)
class OtherIssueAdmin(admin.ModelAdmin):
    pass

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    pass

@admin.register(Questions)
class QuestionAdmin(admin.ModelAdmin):
    pass

@admin.register(CustomerResponse)
class CustomerResponseAdmin(admin.ModelAdmin):
    pass

# class BookingDetailsInline(admin.TabularInline):
#     model = BookingDetails

@admin.action(description="Mark Verified Bookings")
def verifyBookings(modeladmin, request, queryset):
        queryset.update(is_verified=True)

@admin.action(description="Mark Unverified Bookings")
def unVerifyBookings(modeladmin, request, queryset):
        queryset.update(is_verified=False)

@admin.register(Bookings)
class BookingsAdmin(admin.ModelAdmin):
    search_fields = ("pincode", "name", "mobile",)
    list_display = ("name", "mobile", "store","pincode","booking_date","is_verified","order_status",)
    list_filter = ("is_verified", "order_status",)
    list_editable = ("mobile", "pincode",'is_verified',)
    
    save_on_top = True
    show_full_result_count = True
    list_per_page = 20
    list_select_related = True
    actions = [verifyBookings, unVerifyBookings,]