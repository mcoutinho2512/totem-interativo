from django.contrib import admin
from .models import DailyStats, PopularDestination

@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = ['totem', 'date', 'sessions_count', 'interactions_count']
    list_filter = ['totem__city', 'date']

@admin.register(PopularDestination)
class PopularDestinationAdmin(admin.ModelAdmin):
    list_display = ['destination_name', 'city', 'search_count']
    list_filter = ['city']
