"""Content Views"""
from django.db import models
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime

from .models import Category, News, Event, GalleryImage, PointOfInterest
from .serializers import (
    CategorySerializer, NewsSerializer, EventSerializer,
    GalleryImageSerializer, PointOfInterestSerializer
)


class TenantFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        city_id = self.request.headers.get('X-City-ID')
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset


class CategoryViewSet(TenantFilterMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'slug']


class NewsViewSet(TenantFilterMixin, viewsets.ModelViewSet):
    queryset = News.objects.filter(is_published=True).order_by('-publish_at')
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'category', 'is_featured']

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured = self.get_queryset().filter(is_featured=True)[:5]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)


class EventViewSet(TenantFilterMixin, viewsets.ModelViewSet):
    queryset = Event.objects.filter(is_published=True).order_by('start_date')
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'category', 'is_featured']

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        upcoming = self.get_queryset().filter(end_date__gte=timezone.now())[:10]
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured = self.get_queryset().filter(is_featured=True, end_date__gte=timezone.now())[:5]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)


class GalleryImageViewSet(TenantFilterMixin, viewsets.ModelViewSet):
    queryset = GalleryImage.objects.filter(is_active=True).order_by('order')
    serializer_class = GalleryImageSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'is_active']

    @action(detail=False, methods=['get'])
    def active(self, request):
        active = self.get_queryset()
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)


class PointOfInterestViewSet(TenantFilterMixin, viewsets.ModelViewSet):
    queryset = PointOfInterest.objects.filter(is_active=True)
    serializer_class = PointOfInterestSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'category', 'poi_type']

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if not lat or not lng:
            return Response({'error': 'lat and lng required'}, status=400)
        
        pois = self.get_queryset()[:20]
        serializer = self.get_serializer(pois, many=True)
        return Response(serializer.data)


# Playlist Views
from .models_playlist import Playlist, PlaylistItem, RSSFeed
from .serializers import PlaylistSerializer, PlaylistItemSerializer, RSSFeedSerializer


class PlaylistViewSet(TenantFilterMixin, viewsets.ModelViewSet):
    queryset = Playlist.objects.filter(is_active=True)
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'is_active', 'is_default']
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        city_id = request.headers.get('X-City-ID')
        totem_id = request.query_params.get('totem_id')
        
        now = datetime.now()
        current_time = now.time()
        current_weekday = now.weekday()
        
        playlists = Playlist.objects.filter(is_active=True)
        
        if city_id:
            playlists = playlists.filter(city_id=city_id)
        
        for playlist in playlists.order_by('-priority'):
            if playlist.weekdays and current_weekday not in playlist.weekdays:
                continue
            
            if playlist.start_time and playlist.end_time:
                if not (playlist.start_time <= current_time <= playlist.end_time):
                    continue
            
            if not playlist.all_totems and totem_id:
                if not playlist.totems.filter(id=totem_id).exists():
                    continue
            
            serializer = PlaylistSerializer(playlist)
            return Response(serializer.data)
        
        default_playlist = playlists.filter(is_default=True).first()
        if default_playlist:
            serializer = PlaylistSerializer(default_playlist)
            return Response(serializer.data)
        
        return Response({'detail': 'No playlist available'}, status=404)


class PlaylistItemViewSet(viewsets.ModelViewSet):
    queryset = PlaylistItem.objects.filter(is_active=True)
    serializer_class = PlaylistItemSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['playlist', 'item_type', 'is_active']


class RSSFeedViewSet(TenantFilterMixin, viewsets.ModelViewSet):
    queryset = RSSFeed.objects.filter(is_active=True)
    serializer_class = RSSFeedSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'is_active']
