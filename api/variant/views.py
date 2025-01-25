from rest_framework import viewsets
from .serializers import VariantSerializer,PropertySerializer
from .models import Variant, Property

class VariantList(viewsets.ModelViewSet):
    queryset = Variant.objects.all()
    serializer_class = VariantSerializer


class PropertyList(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer