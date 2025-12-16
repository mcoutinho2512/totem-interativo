"""Advertising Views"""
import os
import uuid
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.core.files.storage import default_storage
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from .models import Advertiser, Campaign, AdCreative, AdImpression
from apps.tenants.models import City
from rest_framework import serializers
from datetime import timedelta
import csv
from django.http import HttpResponse


# ============================================
class AdvertiserSerializer(serializers.ModelSerializer):
    campaigns_count = serializers.SerializerMethodField()
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), required=False)

    class Meta:
        model = Advertiser
        fields = ["id", "name", "city", "contact_email", "contact_phone", "is_active", "campaigns_count", "created_at"]

    def get_campaigns_count(self, obj):
        return obj.campaigns.count()

    def create(self, validated_data):
        if "city" not in validated_data:
            validated_data["city"] = City.objects.first()
        return super().create(validated_data)


class CampaignSerializer(serializers.ModelSerializer):
    advertiser_name = serializers.CharField(source='advertiser.name', read_only=True)
    creatives_count = serializers.SerializerMethodField()
    impressions_count = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'advertiser', 'advertiser_name', 'status',
            'start_date', 'end_date', 'all_totems', 'creatives_count',
            'impressions_count', 'created_at', 'updated_at'
        ]

    def get_creatives_count(self, obj):
        return obj.creatives.count()

    def get_impressions_count(self, obj):
        return AdImpression.objects.filter(creative__campaign=obj).count()


class AdCreativeSerializer(serializers.ModelSerializer):
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    impressions_count = serializers.SerializerMethodField()
    file = serializers.FileField(required=False)

    class Meta:
        model = AdCreative
        fields = [
            'id', 'name', 'campaign', 'campaign_name', 'ad_type',
            'file', 'duration', 'click_url', 'order', 'is_active',
            'impressions_count'
        ]

    def get_impressions_count(self, obj):
        return obj.impressions.count()


class AdImpressionSerializer(serializers.ModelSerializer):
    creative_name = serializers.CharField(source='creative.name', read_only=True)
    campaign_name = serializers.CharField(source='creative.campaign.name', read_only=True)
    totem_name = serializers.CharField(source='totem.name', read_only=True)

    class Meta:
        model = AdImpression
        fields = [
            'id', 'creative', 'creative_name', 'campaign_name',
            'totem', 'totem_name', 'displayed_at', 'duration_viewed'
        ]


# ============================================
# ViewSets
# ============================================

class AdvertiserViewSet(viewsets.ModelViewSet):
    """CRUD for Advertisers"""
    queryset = Advertiser.objects.all()
    serializer_class = AdvertiserSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        city_id = self.request.headers.get('X-City-ID')
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset.order_by('-created_at')


class CampaignViewSet(viewsets.ModelViewSet):
    """CRUD for Campaigns"""
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        city_id = self.request.headers.get('X-City-ID')
        if city_id:
            queryset = queryset.filter(advertiser__city_id=city_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')


class AdCreativeViewSet(viewsets.ModelViewSet):
    """CRUD for Ad Creatives"""
    queryset = AdCreative.objects.all()
    serializer_class = AdCreativeSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        campaign_id = self.request.query_params.get('campaign')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset.order_by('campaign', 'order')


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


# ============================================
# Statistics & Analytics Views
# ============================================

class AdvertisingStatsView(APIView):
    """
    General advertising statistics
    GET /api/v1/advertising/stats/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        city_id = request.headers.get('X-City-ID')
        days = int(request.query_params.get('days', 30))

        start_date = timezone.now() - timedelta(days=days)

        # Base queryset
        impressions = AdImpression.objects.filter(displayed_at__gte=start_date)

        if city_id:
            impressions = impressions.filter(totem__city_id=city_id)

        # Total stats
        total_impressions = impressions.count()
        total_duration = impressions.aggregate(total=Sum('duration_viewed'))['total'] or 0

        # Impressions by campaign
        by_campaign = impressions.values(
            'creative__campaign__name',
            'creative__campaign__id'
        ).annotate(
            impressions=Count('id'),
            total_duration=Sum('duration_viewed')
        ).order_by('-impressions')[:10]

        impressions_by_campaign = [
            {
                'campaign_id': item['creative__campaign__id'],
                'campaign': item['creative__campaign__name'],
                'impressions': item['impressions'],
                'avg_duration': round(item['total_duration'] / item['impressions'], 1) if item['impressions'] > 0 else 0
            }
            for item in by_campaign
        ]

        # Impressions by day
        by_day = impressions.annotate(
            date=TruncDate('displayed_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('-date')[:30]

        impressions_by_day = [
            {
                'date': item['date'].isoformat() if item['date'] else None,
                'count': item['count']
            }
            for item in by_day
        ]

        # Top totems
        by_totem = impressions.values(
            'totem__name',
            'totem__id'
        ).annotate(
            impressions=Count('id')
        ).order_by('-impressions')[:10]

        top_totems = [
            {
                'totem_id': item['totem__id'],
                'totem': item['totem__name'],
                'impressions': item['impressions']
            }
            for item in by_totem
        ]

        return Response({
            'period_days': days,
            'total_impressions': total_impressions,
            'total_duration_viewed': total_duration,
            'avg_duration_per_impression': round(total_duration / total_impressions, 1) if total_impressions > 0 else 0,
            'impressions_by_campaign': impressions_by_campaign,
            'impressions_by_day': impressions_by_day,
            'top_totems': top_totems,
        })


class CampaignStatsView(APIView):
    """
    Statistics for a specific campaign
    GET /api/v1/advertising/stats/campaign/{id}/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({'error': 'Campaign not found'}, status=404)

        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)

        impressions = AdImpression.objects.filter(
            creative__campaign=campaign,
            displayed_at__gte=start_date
        )

        total_impressions = impressions.count()
        total_duration = impressions.aggregate(total=Sum('duration_viewed'))['total'] or 0

        # By creative
        by_creative = impressions.values(
            'creative__name',
            'creative__id',
            'creative__ad_type'
        ).annotate(
            impressions=Count('id'),
            total_duration=Sum('duration_viewed')
        ).order_by('-impressions')

        creatives_stats = [
            {
                'creative_id': item['creative__id'],
                'creative': item['creative__name'],
                'type': item['creative__ad_type'],
                'impressions': item['impressions'],
                'avg_duration': round(item['total_duration'] / item['impressions'], 1) if item['impressions'] > 0 else 0
            }
            for item in by_creative
        ]

        # By day
        by_day = impressions.annotate(
            date=TruncDate('displayed_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')

        daily_stats = [
            {'date': item['date'].isoformat(), 'count': item['count']}
            for item in by_day
        ]

        # By totem
        by_totem = impressions.values(
            'totem__name',
            'totem__id'
        ).annotate(
            impressions=Count('id')
        ).order_by('-impressions')[:10]

        return Response({
            'campaign': {
                'id': campaign.id,
                'name': campaign.name,
                'status': campaign.status,
                'start_date': campaign.start_date.isoformat(),
                'end_date': campaign.end_date.isoformat(),
            },
            'period_days': days,
            'total_impressions': total_impressions,
            'total_duration_viewed': total_duration,
            'avg_duration_per_impression': round(total_duration / total_impressions, 1) if total_impressions > 0 else 0,
            'creatives_stats': creatives_stats,
            'daily_stats': daily_stats,
            'totems_stats': list(by_totem),
        })


class DailyStatsView(APIView):
    """
    Daily impressions statistics
    GET /api/v1/advertising/stats/daily/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        city_id = request.headers.get('X-City-ID')
        days = int(request.query_params.get('days', 30))
        campaign_id = request.query_params.get('campaign_id')

        start_date = timezone.now() - timedelta(days=days)

        impressions = AdImpression.objects.filter(displayed_at__gte=start_date)

        if city_id:
            impressions = impressions.filter(totem__city_id=city_id)

        if campaign_id:
            impressions = impressions.filter(creative__campaign_id=campaign_id)

        by_day = impressions.annotate(
            date=TruncDate('displayed_at')
        ).values('date').annotate(
            impressions=Count('id'),
            total_duration=Sum('duration_viewed'),
            unique_creatives=Count('creative', distinct=True),
            unique_totems=Count('totem', distinct=True)
        ).order_by('date')

        return Response({
            'period_days': days,
            'data': [
                {
                    'date': item['date'].isoformat(),
                    'impressions': item['impressions'],
                    'total_duration': item['total_duration'] or 0,
                    'unique_creatives': item['unique_creatives'],
                    'unique_totems': item['unique_totems'],
                }
                for item in by_day
            ]
        })


class ExportImpressionsView(APIView):
    """
    Export impressions to CSV
    GET /api/v1/advertising/impressions/export/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        city_id = request.headers.get('X-City-ID')
        days = int(request.query_params.get('days', 30))
        campaign_id = request.query_params.get('campaign_id')

        start_date = timezone.now() - timedelta(days=days)

        impressions = AdImpression.objects.filter(
            displayed_at__gte=start_date
        ).select_related(
            'creative', 'creative__campaign', 'creative__campaign__advertiser', 'totem'
        )

        if city_id:
            impressions = impressions.filter(totem__city_id=city_id)

        if campaign_id:
            impressions = impressions.filter(creative__campaign_id=campaign_id)

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="impressions_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Data/Hora', 'Anunciante', 'Campanha', 'Criativo',
            'Tipo', 'Totem', 'Duracao (s)'
        ])

        for imp in impressions.order_by('-displayed_at')[:10000]:  # Limit to 10k rows
            writer.writerow([
                imp.id,
                imp.displayed_at.strftime('%Y-%m-%d %H:%M:%S'),
                imp.creative.campaign.advertiser.name,
                imp.creative.campaign.name,
                imp.creative.name,
                imp.creative.ad_type,
                imp.totem.name if imp.totem else '',
                imp.duration_viewed,
            ])

        return response


# ============================================
# Upload View
# ============================================

class AdUploadView(APIView):
    """
    Upload advertising media
    POST /api/v1/advertising/upload/
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]

    ALLOWED_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg'
    ]
    MAX_SIZE = 50 * 1024 * 1024  # 50MB for videos

    def post(self, request):
        file = request.FILES.get('file')
        campaign_id = request.data.get('campaign_id')
        creative_name = request.data.get('name', '')
        duration = int(request.data.get('duration', 10))

        if not file:
            return Response(
                {'error': 'Nenhum arquivo enviado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size
        if file.size > self.MAX_SIZE:
            return Response(
                {'error': f'Arquivo muito grande. Máximo: {self.MAX_SIZE // (1024*1024)}MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        if file.content_type not in self.ALLOWED_TYPES:
            return Response(
                {'error': f'Tipo de arquivo não permitido: {file.content_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine ad type
        ad_type = 'image' if file.content_type.startswith('image/') else 'video'

        # Generate unique filename
        ext = os.path.splitext(file.name)[1].lower()
        filename = f'{uuid.uuid4().hex[:12]}{ext}'
        upload_path = f'ads/{filename}'

        # Save file
        saved_path = default_storage.save(upload_path, file)
        file_url = default_storage.url(saved_path)

        result = {
            'success': True,
            'file_url': file_url,
            'file_path': saved_path,
            'ad_type': ad_type,
            'filename': filename,
            'size': file.size,
        }

        # Create creative if campaign_id provided
        if campaign_id:
            try:
                campaign = Campaign.objects.get(id=campaign_id)

                # Get next order
                max_order = AdCreative.objects.filter(campaign=campaign).aggregate(
                    max_order=models.Max('order')
                )['max_order'] or 0

                creative = AdCreative.objects.create(
                    campaign=campaign,
                    name=creative_name or file.name,
                    ad_type=ad_type,
                    file=saved_path,
                    duration=duration,
                    order=max_order + 1,
                    is_active=True,
                )

                result['creative_id'] = creative.id
                result['creative_name'] = creative.name

            except Campaign.DoesNotExist:
                result['warning'] = 'Campanha não encontrada, arquivo salvo sem associação'

        return Response(result, status=status.HTTP_201_CREATED)


# Need to import models for aggregation
from django.db import models
