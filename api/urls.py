from django.urls import path, include

urlpatterns = [
    path('', include('api.spares.urls')),
    path('', include('api.brand.urls')),
    path('', include('api.bookings.urls')),
    path('', include('api.variant.urls')),
    path('', include('api.units.urls')),
    path('', include('api.product.urls')),
    path('', include('api.subcategory.urls')),
    path('', include('api.category.urls')),
    path('', include('api.department.urls')),
    path('', include('api.request.urls')),
    path('', include('api.store.urls')),
]