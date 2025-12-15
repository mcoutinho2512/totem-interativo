"""Advertising Views"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Advertiser, Campaign, AdCreative, AdImpression
from rest_framework import serializers

class AdCreativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdCreative
        fields = ['id', 'name', 'ad_type', 'file', 'duration', 'click_url', 'order']

class ActiveAdsView(viewsets.ViewSet):
    """Get active ads for a totem"""
    permission_classes = [permissions.AllowAny]
    
    def list(self, request):
        totem_id = request.query_params.get('totem_id')
        now = timezone.now()
        
        campaigns = Campaign.objects.filter(
            status='active',
            start_date__lte=now,
            end_date__gte=now
        )
        
        if totem_id:
            campaigns = campaigns.filter(
                Q(all_totems=True) | Q(totems__id=totem_id)
            )
        
        creatives = AdCreative.objects.filter(
            campaign__in=campaigns,
            is_active=True
        ).order_by('order')
        
        serializer = AdCreativeSerializer(creatives, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def impression(self, request, pk=None):
        """Log an ad impression"""
        totem_id = request.data.get('totem_id')
        duration = request.data.get('duration', 0)
        
        try:
            creative = AdCreative.objects.get(id=pk)
            AdImpression.objects.create(
                creative=creative,
                totem_id=totem_id,
                duration_viewed=duration
            )
            return Response({'status': 'logged'})
        except AdCreative.DoesNotExist:
            return Response({'error': 'Creative not found'}, status=404)
