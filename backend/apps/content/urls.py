"""Content URLs"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, NewsViewSet, EventViewSet,
    GalleryImageViewSet, PointOfInterestViewSet,
    PlaylistViewSet, PlaylistItemViewSet, RSSFeedViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'news', NewsViewSet)
router.register(r'events', EventViewSet)
router.register(r'gallery', GalleryImageViewSet)
router.register(r'pois', PointOfInterestViewSet)
router.register(r'playlists', PlaylistViewSet)
router.register(r'playlist-items', PlaylistItemViewSet)
router.register(r'rss-feeds', RSSFeedViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
