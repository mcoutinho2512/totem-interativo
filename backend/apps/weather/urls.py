from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import current_weather, weather_forecast, weather_alerts, WeatherDataViewSet, WeatherAlertViewSet

router = DefaultRouter()
router.register(r"data", WeatherDataViewSet)
router.register(r"alerts-list", WeatherAlertViewSet)

urlpatterns = [
    path("current/", current_weather, name="current-weather"),
    path("forecast/", weather_forecast, name="weather-forecast"),
    path("alerts/", weather_alerts, name="weather-alerts"),
    path("", include(router.urls)),
]
