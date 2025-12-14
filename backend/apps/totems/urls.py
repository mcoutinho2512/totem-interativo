"""Totem URLs"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TotemViewSet, TotemSessionViewSet

router = DefaultRouter()
router.register(r'', TotemViewSet, basename='totem')
router.register(r'sessions', TotemSessionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
