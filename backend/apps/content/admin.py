"""Content Admin"""
from django.contrib import admin
from .models import Category, News, Event, GalleryImage, PointOfInterest

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'slug', 'order', 'is_active']
    list_filter = ['city', 'is_active']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ['title', 'city', 'category', 'is_featured', 'is_published', 'publish_at']
    list_filter = ['city', 'category', 'is_featured', 'is_published']
    search_fields = ['title', 'content']

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'city', 'venue', 'start_date', 'is_featured', 'is_published']
    list_filter = ['city', 'category', 'is_featured', 'is_published']
    search_fields = ['title', 'description', 'venue']

@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'city', 'order', 'is_active']
    list_filter = ['city', 'is_active']

@admin.register(PointOfInterest)
class PointOfInterestAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'poi_type', 'neighborhood', 'is_featured', 'is_active']
    list_filter = ['city', 'poi_type', 'is_featured', 'is_active']
    search_fields = ['name', 'address']


# Playlist Admin
from .models_playlist import Playlist, PlaylistItem, RSSFeed

class PlaylistItemInline(admin.TabularInline):
    model = PlaylistItem
    extra = 1
    ordering = ['order']

@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'start_time', 'end_time', 'is_active', 'is_default', 'priority']
    list_filter = ['city', 'is_active', 'is_default']
    inlines = [PlaylistItemInline]

@admin.register(PlaylistItem)
class PlaylistItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'playlist', 'item_type', 'duration', 'order', 'is_active']
    list_filter = ['playlist', 'item_type', 'is_active']
    ordering = ['playlist', 'order']

@admin.register(RSSFeed)
class RSSFeedAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'url', 'is_active', 'last_fetched']
    list_filter = ['city', 'is_active']
