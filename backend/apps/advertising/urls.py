"""Advertising URLs"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ActiveAdsView, AdvertiserViewSet, CampaignViewSet, AdCreativeViewSet,
    AdvertisingStatsView, CampaignStatsView, DailyStatsView,
    ExportImpressionsView, AdUploadView
)

router = DefaultRouter()
router.register(r'active', ActiveAdsView, basename='active-ads')
router.register(r'advertisers', AdvertiserViewSet, basename='advertisers')
router.register(r'campaigns', CampaignViewSet, basename='campaigns')
router.register(r'creatives', AdCreativeViewSet, basename='creatives')

urlpatterns = [
    path('', include(router.urls)),
    # Statistics endpoints
    path('stats/', AdvertisingStatsView.as_view(), name='advertising-stats'),
    path('stats/campaign/<int:campaign_id>/', CampaignStatsView.as_view(), name='campaign-stats'),
    path('stats/daily/', DailyStatsView.as_view(), name='daily-stats'),
    # Export endpoint
    path('impressions/export/', ExportImpressionsView.as_view(), name='export-impressions'),
    # Upload endpoint
    path('upload/', AdUploadView.as_view(), name='ad-upload'),
]
