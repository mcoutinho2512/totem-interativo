"""Core Views - Health checks and utilities"""
from rest_framework import views, permissions
from rest_framework.response import Response
from django.db import connection
from django.core.cache import cache

class HealthCheckView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        status = {'status': 'healthy', 'checks': {}}
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            status['checks']['database'] = 'ok'
        except Exception as e:
            status['checks']['database'] = f'error: {str(e)}'
            status['status'] = 'unhealthy'
        try:
            cache.set('health_check', 'ok', 10)
            status['checks']['cache'] = 'ok' if cache.get('health_check') == 'ok' else 'error'
        except Exception as e:
            status['checks']['cache'] = f'error: {str(e)}'
        return Response(status)

class APIInfoView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({
            'name': 'Sanaris City Totem API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/v1/core/health/',
                'cities': '/api/v1/tenants/cities/',
                'totems': '/api/v1/totems/',
                'content': '/api/v1/content/',
                'navigation': '/api/v1/navigation/',
                'weather': '/api/v1/weather/',
            }
        })
