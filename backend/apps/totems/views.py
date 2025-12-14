"""Totems Views"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone

from .models import Totem, TotemSession
from .serializers import TotemSerializer, TotemSessionSerializer


class TotemViewSet(viewsets.ModelViewSet):
    queryset = Totem.objects.all()
    serializer_class = TotemSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['post'])
    def heartbeat(self, request, pk=None):
        totem = self.get_object()
        totem.last_heartbeat = timezone.now()
        totem.last_ip = request.META.get('REMOTE_ADDR')
        totem.save(update_fields=['last_heartbeat', 'last_ip'])
        return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def identify_totem(request):
    """Identifica totem pelo identifier"""
    identifier = request.data.get('identifier')
    
    if not identifier:
        return Response({'error': 'Identifier required'}, status=400)
    
    try:
        totem = Totem.objects.select_related('city').get(identifier=identifier)
        return Response({
            'id': totem.id,
            'identifier': totem.identifier,
            'name': totem.name,
            'city': totem.city.id,
            'city_name': totem.city.name,
            'latitude': str(totem.latitude),
            'longitude': str(totem.longitude),
            'address': totem.address,
        })
    except Totem.DoesNotExist:
        return Response({'error': 'Totem not found'}, status=404)


class TotemSessionViewSet(viewsets.ModelViewSet):
    queryset = TotemSession.objects.all()
    serializer_class = TotemSessionSerializer
    permission_classes = [permissions.AllowAny]  # Permitir criar sessões sem auth
    
    def create(self, request, *args, **kwargs):
        totem_id = request.data.get('totem')
        language = request.data.get('language', 'pt-BR')
        
        if not totem_id:
            return Response({'error': 'Totem ID required'}, status=400)
        
        try:
            totem = Totem.objects.get(id=totem_id)
        except Totem.DoesNotExist:
            return Response({'error': 'Totem not found'}, status=404)
        
        session = TotemSession.objects.create(
            totem=totem,
            language=language,
            ip_address=request.META.get('REMOTE_ADDR', '')
        )
        
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=201)
