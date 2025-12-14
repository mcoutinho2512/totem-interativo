from django.contrib import admin
from .models import WeatherData, WeatherAlert

@admin.register(WeatherData)
class WeatherDataAdmin(admin.ModelAdmin):
    list_display = ['city', 'temperature', 'description', 'fetched_at']
    list_filter = ['city']
    readonly_fields = ['fetched_at']

@admin.register(WeatherAlert)
class WeatherAlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'city', 'severity', 'starts_at', 'is_active']
    list_filter = ['city', 'severity', 'is_active']
