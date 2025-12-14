"""Navigation URLs"""
from django.urls import path
from .views import RouteView, MultiRouteView, GeocodeView, QRCodeView

urlpatterns = [
    path('route/', RouteView.as_view(), name='route'),
    path('routes/', MultiRouteView.as_view(), name='multi-route'),
    path('geocode/', GeocodeView.as_view(), name='geocode'),
    path('qrcode/', QRCodeView.as_view(), name='qrcode'),
]
