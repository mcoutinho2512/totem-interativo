"""
Tenant Middleware - Sets current tenant based on request
"""
from threading import local
from .models import City

_thread_locals = local()


def get_current_city():
    """Get the current city from thread local storage"""
    return getattr(_thread_locals, 'city', None)


def set_current_city(city):
    """Set the current city in thread local storage"""
    _thread_locals.city = city


class TenantMiddleware:
    """
    Middleware to identify tenant from request headers or subdomain
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Try to get city from header (for API requests)
        city_slug = request.headers.get('X-City-Slug')
        city_id = request.headers.get('X-City-ID')
        
        city = None
        
        if city_id:
            try:
                city = City.objects.get(id=city_id, is_active=True)
            except City.DoesNotExist:
                pass
        elif city_slug:
            try:
                city = City.objects.get(slug=city_slug, is_active=True)
            except City.DoesNotExist:
                pass
        
        # Set city in thread local and request
        set_current_city(city)
        request.city = city
        
        response = self.get_response(request)
        
        # Clean up
        set_current_city(None)
        
        return response
