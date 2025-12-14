"""Analytics Views"""
from rest_framework import viewsets, views, permissions
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta
from .models import DailyStats, PopularDestination
from apps.totems.models import TotemSession
from apps.navigation.models import RouteSearch

class DashboardView(views.APIView):
    """Dashboard summary"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        city = getattr(request, 'city', None)
        days = int(request.query_params.get('days', 7))
        start_date = datetime.now().date() - timedelta(days=days)
        
        stats_qs = DailyStats.objects.filter(date__gte=start_date)
        if city:
            stats_qs = stats_qs.filter(totem__city=city)
        
        totals = stats_qs.aggregate(
            total_sessions=Sum('sessions_count'),
            total_interactions=Sum('interactions_count'),
            total_routes=Sum('routes_searched'),
            avg_duration=Avg('avg_session_duration')
        )
        
        return Response({
            'period_days': days,
            'totals': totals,
        })
