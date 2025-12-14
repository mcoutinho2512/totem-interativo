"""
Tenant URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CityViewSet, CityAdminViewSet

router = DefaultRouter()
router.register(r'cities', CityViewSet)
router.register(r'admins', CityAdminViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
