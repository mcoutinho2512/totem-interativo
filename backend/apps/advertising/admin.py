"""
Advertising Admin - Enhanced admin interface for advertising management
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Sum
from .models import Advertiser, Campaign, AdCreative, AdImpression


class AdCreativeInline(admin.TabularInline):
    """Inline admin for ad creatives within a campaign"""
    model = AdCreative
    extra = 1
    fields = ['name', 'ad_type', 'file', 'duration', 'order', 'is_active', 'preview_file']
    readonly_fields = ['preview_file']
    ordering = ['order']

    def preview_file(self, obj):
        if obj.file:
            if obj.ad_type == 'image':
                return format_html(
                    '<img src="{}" style="max-height: 60px; max-width: 100px;" />',
                    obj.file.url
                )
            elif obj.ad_type == 'video':
                return format_html(
                    '<video src="{}" style="max-height: 60px; max-width: 100px;" controls></video>',
                    obj.file.url
                )
        return '-'
    preview_file.short_description = 'Preview'


@admin.register(Advertiser)
class AdvertiserAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'contact_email', 'contact_phone', 'campaigns_count', 'is_active', 'created_at']
    list_filter = ['city', 'is_active', 'created_at']
    search_fields = ['name', 'contact_email', 'contact_phone']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('city', 'name', 'is_active')
        }),
        ('Contato', {
            'fields': ('contact_email', 'contact_phone')
        }),
    )

    def campaigns_count(self, obj):
        count = obj.campaigns.count()
        active = obj.campaigns.filter(status='active').count()
        return format_html('{} total / <span style="color: green;">{} ativas</span>', count, active)
    campaigns_count.short_description = 'Campanhas'

    actions = ['activate_advertisers', 'deactivate_advertisers']

    @admin.action(description='Ativar anunciantes selecionados')
    def activate_advertisers(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} anunciante(s) ativado(s).')

    @admin.action(description='Desativar anunciantes selecionados')
    def deactivate_advertisers(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} anunciante(s) desativado(s).')


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'advertiser', 'status_badge', 'start_date', 'end_date', 'creatives_count', 'impressions_count', 'total_duration']
    list_filter = ['status', 'advertiser__city', 'advertiser', 'all_totems', 'start_date', 'end_date']
    search_fields = ['name', 'advertiser__name']
    ordering = ['-created_at']
    date_hierarchy = 'start_date'
    filter_horizontal = ['totems']

    inlines = [AdCreativeInline]

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('advertiser', 'name', 'status')
        }),
        ('Período', {
            'fields': ('start_date', 'end_date')
        }),
        ('Segmentação', {
            'fields': ('all_totems', 'totems'),
            'description': 'Escolha se a campanha será exibida em todos os totems ou selecione totems específicos.'
        }),
        ('Horários', {
            'fields': ('schedule',),
            'classes': ('collapse',),
            'description': 'Configuração avançada de horários de exibição.'
        }),
    )

    def status_badge(self, obj):
        colors = {
            'draft': '#6c757d',
            'scheduled': '#0dcaf0',
            'active': '#198754',
            'paused': '#ffc107',
            'ended': '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def creatives_count(self, obj):
        total = obj.creatives.count()
        active = obj.creatives.filter(is_active=True).count()
        return f'{active}/{total}'
    creatives_count.short_description = 'Criativos'

    def impressions_count(self, obj):
        count = AdImpression.objects.filter(creative__campaign=obj).count()
        return format_html('<strong>{}</strong>', count)
    impressions_count.short_description = 'Impressões'

    def total_duration(self, obj):
        result = AdImpression.objects.filter(creative__campaign=obj).aggregate(
            total=Sum('duration_viewed')
        )
        seconds = result['total'] or 0
        if seconds >= 3600:
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            return f'{hours}h {minutes}m'
        elif seconds >= 60:
            minutes = seconds // 60
            return f'{minutes}m'
        return f'{seconds}s'
    total_duration.short_description = 'Tempo Total'

    actions = ['activate_campaigns', 'pause_campaigns', 'end_campaigns', 'duplicate_campaigns']

    @admin.action(description='Ativar campanhas selecionadas')
    def activate_campaigns(self, request, queryset):
        updated = queryset.update(status='active')
        self.message_user(request, f'{updated} campanha(s) ativada(s).')

    @admin.action(description='Pausar campanhas selecionadas')
    def pause_campaigns(self, request, queryset):
        updated = queryset.update(status='paused')
        self.message_user(request, f'{updated} campanha(s) pausada(s).')

    @admin.action(description='Finalizar campanhas selecionadas')
    def end_campaigns(self, request, queryset):
        updated = queryset.update(status='ended')
        self.message_user(request, f'{updated} campanha(s) finalizada(s).')

    @admin.action(description='Duplicar campanhas selecionadas')
    def duplicate_campaigns(self, request, queryset):
        for campaign in queryset:
            creatives = list(campaign.creatives.all())
            campaign.pk = None
            campaign.name = f'{campaign.name} (cópia)'
            campaign.status = 'draft'
            campaign.save()

            for creative in creatives:
                creative.pk = None
                creative.campaign = campaign
                creative.save()

        self.message_user(request, f'{queryset.count()} campanha(s) duplicada(s).')


@admin.register(AdCreative)
class AdCreativeAdmin(admin.ModelAdmin):
    list_display = ['name', 'campaign', 'ad_type_icon', 'preview_thumbnail', 'duration', 'order', 'is_active', 'impressions_count']
    list_filter = ['ad_type', 'is_active', 'campaign__advertiser__city', 'campaign__advertiser', 'campaign']
    search_fields = ['name', 'campaign__name', 'campaign__advertiser__name']
    ordering = ['campaign', 'order']

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('campaign', 'name', 'ad_type')
        }),
        ('Mídia', {
            'fields': ('file', 'duration', 'click_url')
        }),
        ('Configuração', {
            'fields': ('order', 'is_active')
        }),
    )

    def ad_type_icon(self, obj):
        icons = {
            'image': '🖼️',
            'video': '🎬',
        }
        return f'{icons.get(obj.ad_type, "📄")} {obj.get_ad_type_display()}'
    ad_type_icon.short_description = 'Tipo'

    def preview_thumbnail(self, obj):
        if obj.file:
            if obj.ad_type == 'image':
                return format_html(
                    '<img src="{}" style="max-height: 50px; max-width: 80px; border-radius: 4px;" />',
                    obj.file.url
                )
            elif obj.ad_type == 'video':
                return format_html(
                    '<span style="color: #6c757d;">🎬 Vídeo</span>'
                )
        return '-'
    preview_thumbnail.short_description = 'Preview'

    def impressions_count(self, obj):
        return obj.impressions.count()
    impressions_count.short_description = 'Impressões'

    actions = ['activate_creatives', 'deactivate_creatives']

    @admin.action(description='Ativar criativos selecionados')
    def activate_creatives(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} criativo(s) ativado(s).')

    @admin.action(description='Desativar criativos selecionados')
    def deactivate_creatives(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} criativo(s) desativado(s).')


@admin.register(AdImpression)
class AdImpressionAdmin(admin.ModelAdmin):
    list_display = ['id', 'creative_name', 'campaign_name', 'totem', 'displayed_at', 'duration_formatted']
    list_filter = ['totem__city', 'totem', 'creative__campaign', 'displayed_at']
    search_fields = ['creative__name', 'creative__campaign__name', 'totem__name']
    ordering = ['-displayed_at']
    date_hierarchy = 'displayed_at'

    readonly_fields = ['creative', 'totem', 'displayed_at', 'duration_viewed']

    def has_add_permission(self, request):
        return False  # Impressões são criadas automaticamente

    def has_change_permission(self, request, obj=None):
        return False  # Impressões são read-only

    def creative_name(self, obj):
        return obj.creative.name
    creative_name.short_description = 'Criativo'
    creative_name.admin_order_field = 'creative__name'

    def campaign_name(self, obj):
        return obj.creative.campaign.name
    campaign_name.short_description = 'Campanha'
    campaign_name.admin_order_field = 'creative__campaign__name'

    def duration_formatted(self, obj):
        seconds = obj.duration_viewed
        if seconds >= 60:
            minutes = seconds // 60
            secs = seconds % 60
            return f'{minutes}m {secs}s'
        return f'{seconds}s'
    duration_formatted.short_description = 'Duração'
    duration_formatted.admin_order_field = 'duration_viewed'
