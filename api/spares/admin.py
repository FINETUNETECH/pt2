from django.contrib import admin
from .models import *

@admin.register(SpareCosting)
class SpareCostingAdmin(admin.ModelAdmin):
    pass
@admin.register(SpareVariety)
class SpareVarietyAdmin(admin.ModelAdmin):
    pass
@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    pass

class SpareInline(admin.TabularInline):
    model = Spare.spare_variety.through

@admin.register(Spare)
class SpareAdmin(admin.ModelAdmin):
    search_fields = ['name','product__name']
    inlines= (SpareInline,)

@admin.register(Quality)
class SpareAdmin(admin.ModelAdmin):
    pass

@admin.register(Type)
class TypeAdmin(admin.ModelAdmin):
    pass

@admin.register(SpareProperty)
class SparePropertyAdmin(admin.ModelAdmin):
    pass

@admin.register(History)
class HistoryAdmin(admin.ModelAdmin):
    pass