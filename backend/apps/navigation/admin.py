from django.contrib import admin
from .models import RouteSearch

@admin.register(RouteSearch)
class RouteSearchAdmin(admin.ModelAdmin):
    list_display = ['totem', 'destination_name', 'transport_mode', 'searched_at']
    list_filter = ['totem__city', 'transport_mode']
    search_fields = ['destination_name']
    readonly_fields = ['searched_at']
