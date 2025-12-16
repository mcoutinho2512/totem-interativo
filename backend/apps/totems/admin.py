"""Totem Admin"""
from django.contrib import admin
from .models import Totem, TotemSession, ContentBlock


@admin.register(Totem)
class TotemAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'identifier', 'status', 'last_heartbeat']
    list_filter = ['city', 'status', 'neighborhood']
    search_fields = ['name', 'identifier', 'address']
    readonly_fields = ['last_heartbeat', 'last_ip', 'created_at', 'updated_at']


@admin.register(TotemSession)
class TotemSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'totem', 'started_at', 'ended_at', 'interactions_count']
    list_filter = ['totem__city', 'language']
    readonly_fields = ['started_at']


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    list_display = ['totem', 'position', 'block_type', 'title', 'is_active']
    list_filter = ['totem', 'block_type', 'is_active']
    search_fields = ['title', 'subtitle']
    ordering = ['totem', 'position', 'order']
