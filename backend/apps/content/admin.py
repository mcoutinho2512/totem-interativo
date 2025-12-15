"""
Content Admin - Enhanced admin interface for content management
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count
from .models import Category, News, Event, GalleryImage, PointOfInterest


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'color_preview', 'icon', 'slug', 'order', 'items_count', 'is_active']
    list_filter = ['city', 'is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['city', 'order', 'name']
    list_editable = ['order', 'is_active']

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('city', 'name', 'slug')
        }),
        ('Aparência', {
            'fields': ('icon', 'color')
        }),
        ('Configuração', {
            'fields': ('order', 'is_active')
        }),
    )

    def color_preview(self, obj):
        return format_html(
            '<span style="background-color: {}; padding: 3px 15px; border-radius: 3px;">&nbsp;</span> {}',
            obj.color, obj.color
        )
    color_preview.short_description = 'Cor'

    def items_count(self, obj):
        news_count = obj.news_set.count()
        events_count = obj.event_set.count()
        pois_count = obj.pointofinterest_set.count()
        return f'N:{news_count} E:{events_count} P:{pois_count}'
    items_count.short_description = 'Itens (N/E/P)'


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ['title', 'city', 'category', 'image_preview', 'is_featured', 'is_published', 'publish_at', 'created_at']
    list_filter = ['city', 'category', 'is_featured', 'is_published', 'publish_at', 'created_at']
    search_fields = ['title', 'subtitle', 'content']
    ordering = ['-publish_at']
    date_hierarchy = 'publish_at'
    list_editable = ['is_featured', 'is_published']

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('city', 'category', 'title', 'subtitle')
        }),
        ('Conteúdo', {
            'fields': ('content', 'image')
        }),
        ('Publicação', {
            'fields': ('is_featured', 'is_published', 'publish_at', 'expires_at')
        }),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 40px; max-width: 60px; border-radius: 4px;" />',
                obj.image.url
            )
        return format_html('<span style="color: #999;">Sem imagem</span>')
    image_preview.short_description = 'Imagem'

    def is_featured_icon(self, obj):
        if obj.is_featured:
            return format_html('<span style="color: gold; font-size: 18px;">★</span>')
        return format_html('<span style="color: #ddd; font-size: 18px;">☆</span>')
    is_featured_icon.short_description = 'Destaque'
    is_featured_icon.admin_order_field = 'is_featured'

    def is_published_icon(self, obj):
        if obj.is_published:
            return format_html('<span style="color: green;">✓ Publicado</span>')
        return format_html('<span style="color: red;">✗ Rascunho</span>')
    is_published_icon.short_description = 'Status'
    is_published_icon.admin_order_field = 'is_published'

    actions = ['publish_news', 'unpublish_news', 'feature_news', 'unfeature_news']

    @admin.action(description='Publicar notícias selecionadas')
    def publish_news(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} notícia(s) publicada(s).')

    @admin.action(description='Despublicar notícias selecionadas')
    def unpublish_news(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} notícia(s) despublicada(s).')

    @admin.action(description='Marcar como destaque')
    def feature_news(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} notícia(s) marcada(s) como destaque.')

    @admin.action(description='Remover destaque')
    def unfeature_news(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} notícia(s) removida(s) do destaque.')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'city', 'category', 'image_preview', 'venue', 'start_date', 'end_date', 'price', 'is_featured', 'is_published']
    list_filter = ['city', 'category', 'is_featured', 'is_published', 'is_all_day', 'start_date']
    search_fields = ['title', 'description', 'venue', 'address']
    ordering = ['start_date']
    date_hierarchy = 'start_date'
    list_editable = ['is_featured', 'is_published']

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('city', 'category', 'title', 'description', 'image')
        }),
        ('Local', {
            'fields': ('venue', 'address', ('latitude', 'longitude'))
        }),
        ('Data e Hora', {
            'fields': (('start_date', 'end_date'), 'is_all_day')
        }),
        ('Detalhes', {
            'fields': ('price', 'url')
        }),
        ('Publicação', {
            'fields': ('is_featured', 'is_published')
        }),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 40px; max-width: 60px; border-radius: 4px;" />',
                obj.image.url
            )
        return format_html('<span style="color: #999;">Sem imagem</span>')
    image_preview.short_description = 'Imagem'

    def is_featured_icon(self, obj):
        if obj.is_featured:
            return format_html('<span style="color: gold; font-size: 18px;">★</span>')
        return format_html('<span style="color: #ddd; font-size: 18px;">☆</span>')
    is_featured_icon.short_description = 'Destaque'
    is_featured_icon.admin_order_field = 'is_featured'

    def is_published_icon(self, obj):
        if obj.is_published:
            return format_html('<span style="color: green;">✓ Publicado</span>')
        return format_html('<span style="color: red;">✗ Rascunho</span>')
    is_published_icon.short_description = 'Status'
    is_published_icon.admin_order_field = 'is_published'

    actions = ['publish_events', 'unpublish_events', 'feature_events', 'unfeature_events']

    @admin.action(description='Publicar eventos selecionados')
    def publish_events(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} evento(s) publicado(s).')

    @admin.action(description='Despublicar eventos selecionados')
    def unpublish_events(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} evento(s) despublicado(s).')

    @admin.action(description='Marcar como destaque')
    def feature_events(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} evento(s) marcado(s) como destaque.')

    @admin.action(description='Remover destaque')
    def unfeature_events(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} evento(s) removido(s) do destaque.')


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'city', 'image_preview', 'order', 'is_active', 'display_period', 'created_at']
    list_filter = ['city', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['city', 'order', '-created_at']
    list_editable = ['order', 'is_active']

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('city', 'title', 'description')
        }),
        ('Imagem', {
            'fields': ('image',)
        }),
        ('Exibição', {
            'fields': ('order', 'is_active', ('display_start', 'display_end'))
        }),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 80px; border-radius: 4px;" />',
                obj.image.url
            )
        return format_html('<span style="color: #999;">Sem imagem</span>')
    image_preview.short_description = 'Preview'

    def display_period(self, obj):
        if obj.display_start and obj.display_end:
            return f'{obj.display_start.strftime("%d/%m")} - {obj.display_end.strftime("%d/%m")}'
        elif obj.display_start:
            return f'A partir de {obj.display_start.strftime("%d/%m")}'
        elif obj.display_end:
            return f'Até {obj.display_end.strftime("%d/%m")}'
        return 'Sempre'
    display_period.short_description = 'Período'

    actions = ['activate_images', 'deactivate_images']

    @admin.action(description='Ativar imagens selecionadas')
    def activate_images(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} imagem(ns) ativada(s).')

    @admin.action(description='Desativar imagens selecionadas')
    def deactivate_images(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} imagem(ns) desativada(s).')


@admin.register(PointOfInterest)
class PointOfInterestAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'poi_type_badge', 'image_preview', 'neighborhood', 'phone', 'is_featured', 'is_active']
    list_filter = ['city', 'poi_type', 'category', 'is_featured', 'is_active', 'neighborhood']
    search_fields = ['name', 'address', 'neighborhood', 'phone', 'description']
    ordering = ['city', 'poi_type', 'name']
    list_editable = ['is_featured', 'is_active']

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('city', 'category', 'name', 'poi_type', 'description', 'image')
        }),
        ('Localização', {
            'fields': ('address', 'neighborhood', ('latitude', 'longitude'))
        }),
        ('Contato', {
            'fields': ('phone', 'website')
        }),
        ('Horário de Funcionamento', {
            'fields': ('opening_hours',),
            'classes': ('collapse',),
        }),
        ('Configuração', {
            'fields': ('is_featured', 'is_active')
        }),
    )

    def poi_type_badge(self, obj):
        colors = {
            'restaurant': '#f39c12',
            'hotel': '#3498db',
            'attraction': '#9b59b6',
            'shopping': '#e91e63',
            'hospital': '#e74c3c',
            'pharmacy': '#27ae60',
            'police': '#34495e',
            'transport': '#1abc9c',
            'bank': '#607d8b',
            'other': '#95a5a6',
        }
        icons = {
            'restaurant': '🍽️',
            'hotel': '🏨',
            'attraction': '🎭',
            'shopping': '🛍️',
            'hospital': '🏥',
            'pharmacy': '💊',
            'police': '👮',
            'transport': '🚌',
            'bank': '🏦',
            'other': '📍',
        }
        color = colors.get(obj.poi_type, '#95a5a6')
        icon = icons.get(obj.poi_type, '📍')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px;">{} {}</span>',
            color, icon, obj.get_poi_type_display()
        )
    poi_type_badge.short_description = 'Tipo'
    poi_type_badge.admin_order_field = 'poi_type'

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 40px; max-width: 60px; border-radius: 4px;" />',
                obj.image.url
            )
        return format_html('<span style="color: #999;">Sem foto</span>')
    image_preview.short_description = 'Foto'

    def is_featured_icon(self, obj):
        if obj.is_featured:
            return format_html('<span style="color: gold; font-size: 18px;">★</span>')
        return format_html('<span style="color: #ddd; font-size: 18px;">☆</span>')
    is_featured_icon.short_description = 'Destaque'
    is_featured_icon.admin_order_field = 'is_featured'

    def is_active_icon(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    is_active_icon.short_description = 'Ativo'
    is_active_icon.admin_order_field = 'is_active'

    actions = ['activate_pois', 'deactivate_pois', 'feature_pois', 'unfeature_pois']

    @admin.action(description='Ativar POIs selecionados')
    def activate_pois(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} POI(s) ativado(s).')

    @admin.action(description='Desativar POIs selecionados')
    def deactivate_pois(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} POI(s) desativado(s).')

    @admin.action(description='Marcar como destaque')
    def feature_pois(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} POI(s) marcado(s) como destaque.')

    @admin.action(description='Remover destaque')
    def unfeature_pois(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} POI(s) removido(s) do destaque.')


# Playlist Admin
from .models_playlist import Playlist, PlaylistItem, RSSFeed


class PlaylistItemInline(admin.TabularInline):
    model = PlaylistItem
    extra = 1
    ordering = ['order']
    fields = ['name', 'item_type', 'duration', 'order', 'is_active']


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'time_range', 'weekdays_display', 'items_count', 'is_active', 'is_default', 'priority']
    list_filter = ['city', 'is_active', 'is_default']
    search_fields = ['name']
    ordering = ['city', '-priority', 'name']
    list_editable = ['is_active', 'is_default', 'priority']
    inlines = [PlaylistItemInline]

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('city', 'name', 'priority')
        }),
        ('Horário', {
            'fields': (('start_time', 'end_time'), 'weekdays')
        }),
        ('Configuração', {
            'fields': ('is_active', 'is_default')
        }),
    )

    def time_range(self, obj):
        return f'{obj.start_time.strftime("%H:%M")} - {obj.end_time.strftime("%H:%M")}'
    time_range.short_description = 'Horário'

    def weekdays_display(self, obj):
        days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
        if obj.weekdays:
            selected = [days[i] for i in obj.weekdays if i < len(days)]
            return ', '.join(selected) if selected else 'Todos'
        return 'Todos'
    weekdays_display.short_description = 'Dias'

    def items_count(self, obj):
        total = obj.items.count()
        active = obj.items.filter(is_active=True).count()
        return f'{active}/{total}'
    items_count.short_description = 'Itens'

    actions = ['activate_playlists', 'deactivate_playlists']

    @admin.action(description='Ativar playlists selecionadas')
    def activate_playlists(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} playlist(s) ativada(s).')

    @admin.action(description='Desativar playlists selecionadas')
    def deactivate_playlists(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} playlist(s) desativada(s).')


@admin.register(PlaylistItem)
class PlaylistItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'playlist', 'item_type_badge', 'duration', 'order', 'is_active']
    list_filter = ['playlist__city', 'playlist', 'item_type', 'is_active']
    search_fields = ['name', 'playlist__name']
    ordering = ['playlist', 'order']
    list_editable = ['order', 'is_active']

    def item_type_badge(self, obj):
        colors = {
            'image': '#3498db',
            'video': '#9b59b6',
            'ad': '#f39c12',
            'weather': '#1abc9c',
            'news': '#e74c3c',
            'events': '#27ae60',
            'rss': '#607d8b',
            'html': '#e91e63',
            'clock': '#34495e',
        }
        color = colors.get(obj.item_type, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_item_type_display()
        )
    item_type_badge.short_description = 'Tipo'


@admin.register(RSSFeed)
class RSSFeedAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'url_short', 'is_active', 'last_fetched', 'items_count']
    list_filter = ['city', 'is_active']
    search_fields = ['name', 'url']
    ordering = ['city', 'name']

    def url_short(self, obj):
        if len(obj.url) > 50:
            return f'{obj.url[:50]}...'
        return obj.url
    url_short.short_description = 'URL'

    def items_count(self, obj):
        if obj.cached_items:
            return len(obj.cached_items)
        return 0
    items_count.short_description = 'Itens'

    actions = ['refresh_feeds']

    @admin.action(description='Atualizar feeds selecionados')
    def refresh_feeds(self, request, queryset):
        # Aqui poderia chamar uma task Celery para atualizar os feeds
        self.message_user(request, f'{queryset.count()} feed(s) marcado(s) para atualização.')
