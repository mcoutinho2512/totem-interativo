"""
Tenant Views
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import City, CityAdmin
from .serializers import CitySerializer, CityPublicSerializer, CityAdminSerializer


class CityViewSet(viewsets.ModelViewSet):
    """City management viewset"""
    queryset = City.objects.filter(is_active=True)
    serializer_class = CitySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['state', 'is_active']
    search_fields = ['name', 'slug']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'public']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def public(self, request, pk=None):
        """Get public city info for totems"""
        city = self.get_object()
        serializer = CityPublicSerializer(city)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def by_slug(self, request):
        """Get city by slug"""
        slug = request.query_params.get('slug')
        if not slug:
            return Response({'error': 'slug parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            city = City.objects.get(slug=slug, is_active=True)
            serializer = CityPublicSerializer(city)
            return Response(serializer.data)
        except City.DoesNotExist:
            return Response({'error': 'City not found'}, status=status.HTTP_404_NOT_FOUND)


class CityAdminViewSet(viewsets.ModelViewSet):
    """City admin management"""
    queryset = CityAdmin.objects.all()
    serializer_class = CityAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'role', 'is_active']
