from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActiveAdsView

router = DefaultRouter()
router.register(r'active', ActiveAdsView, basename='active-ads')

urlpatterns = [
    path('', include(router.urls)),
]
