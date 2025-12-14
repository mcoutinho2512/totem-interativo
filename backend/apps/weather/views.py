from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes as perm_classes
from rest_framework.response import Response
import datetime

from .models import WeatherData, WeatherAlert
from .serializers import WeatherDataSerializer, WeatherAlertSerializer

@api_view(["GET"])
@perm_classes([permissions.AllowAny])
def current_weather(request):
    return Response({
        "temperature": 28,
        "feels_like": 30,
        "humidity": 65,
        "wind_speed": 12,
        "description": "Parcialmente nublado",
        "icon": "02d",
        "icon_url": "https://openweathermap.org/img/wn/02d@2x.png"
    })

@api_view(["GET"])
@perm_classes([permissions.AllowAny])
def weather_forecast(request):
    forecast = []
    for i in range(5):
        day = datetime.date.today() + datetime.timedelta(days=i)
        forecast.append({
            "date": day.isoformat(),
            "temp_min": 22 + i,
            "temp_max": 28 + i,
            "icon_url": "https://openweathermap.org/img/wn/02d@2x.png"
        })
    return Response({"forecast": forecast})

@api_view(["GET"])
@perm_classes([permissions.AllowAny])
def weather_alerts(request):
    return Response([])

class WeatherDataViewSet(viewsets.ModelViewSet):
    queryset = WeatherData.objects.all()
    serializer_class = WeatherDataSerializer
    permission_classes = [permissions.AllowAny]

class WeatherAlertViewSet(viewsets.ModelViewSet):
    queryset = WeatherAlert.objects.filter(is_active=True)
    serializer_class = WeatherAlertSerializer
    permission_classes = [permissions.AllowAny]
