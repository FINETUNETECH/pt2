from rest_framework import viewsets
from .serializers import UnitSerializer
from .models import Unit

class UnitList(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer