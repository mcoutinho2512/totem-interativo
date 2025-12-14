from django.contrib import admin
from .models import Advertiser, Campaign, AdCreative, AdImpression

@admin.register(Advertiser)
class AdvertiserAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'contact_email', 'is_active']
    list_filter = ['city', 'is_active']

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'advertiser', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'advertiser__city']

@admin.register(AdCreative)
class AdCreativeAdmin(admin.ModelAdmin):
    list_display = ['name', 'campaign', 'ad_type', 'is_active']
    list_filter = ['ad_type', 'is_active']

@admin.register(AdImpression)
class AdImpressionAdmin(admin.ModelAdmin):
    list_display = ['creative', 'totem', 'displayed_at', 'duration_viewed']
    list_filter = ['totem__city']
