"""Totem URLs"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TotemViewSet, TotemSessionViewSet, identify_totem

# Separate routers to avoid route conflicts
totem_router = DefaultRouter()
totem_router.register(r'', TotemViewSet, basename='totem')

session_router = DefaultRouter()
session_router.register(r'', TotemSessionViewSet, basename='session')

urlpatterns = [
    path('identify/', identify_totem, name='identify-totem'),
    path('sessions/', include(session_router.urls)),
    path('', include(totem_router.urls)),
]
