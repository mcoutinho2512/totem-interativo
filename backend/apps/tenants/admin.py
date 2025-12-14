"""
Tenant Admin
"""
from django.contrib import admin
from .models import City, CityAdmin


@admin.register(City)
class CityAdminModel(admin.ModelAdmin):
    list_display = ['name', 'state', 'is_active', 'created_at']
    list_filter = ['state', 'is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CityAdmin)
class CityAdminAdminModel(admin.ModelAdmin):
    list_display = ['user', 'city', 'role', 'is_active']
    list_filter = ['city', 'role', 'is_active']
    search_fields = ['user__username', 'user__email']
