"""
Weather Models and Service
"""
from django.db import models
from django.conf import settings
from django.core.cache import cache
from apps.tenants.models import City
import httpx
from datetime import datetime


class WeatherData(models.Model):
    """Cached weather data for cities"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='weather_data')
    
    temperature = models.DecimalField('Temperatura', max_digits=5, decimal_places=2)
    feels_like = models.DecimalField('Sensação', max_digits=5, decimal_places=2)
    humidity = models.IntegerField('Umidade (%)')
    pressure = models.IntegerField('Pressão (hPa)')
    wind_speed = models.DecimalField('Vento (m/s)', max_digits=5, decimal_places=2)
    wind_direction = models.IntegerField('Direção Vento')
    
    description = models.CharField('Descrição', max_length=100)
    icon = models.CharField('Ícone', max_length=10)
    
    visibility = models.IntegerField('Visibilidade (m)', null=True)
    clouds = models.IntegerField('Nuvens (%)', null=True)
    
    sunrise = models.DateTimeField('Nascer do Sol', null=True)
    sunset = models.DateTimeField('Pôr do Sol', null=True)
    
    fetched_at = models.DateTimeField('Obtido em', auto_now=True)
    
    class Meta:
        verbose_name = 'Dados Climáticos'
        verbose_name_plural = 'Dados Climáticos'
        ordering = ['-fetched_at']
        get_latest_by = 'fetched_at'


class WeatherAlert(models.Model):
    """Weather alerts from civil defense or weather services"""
    SEVERITY_CHOICES = [
        ('info', 'Informativo'),
        ('warning', 'Alerta'),
        ('danger', 'Perigo'),
        ('extreme', 'Extremo'),
    ]
    
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='weather_alerts')
    
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descrição')
    severity = models.CharField('Severidade', max_length=20, choices=SEVERITY_CHOICES)
    
    event_type = models.CharField('Tipo de Evento', max_length=100)
    source = models.CharField('Fonte', max_length=100)
    
    starts_at = models.DateTimeField('Início')
    ends_at = models.DateTimeField('Fim', null=True)
    
    is_active = models.BooleanField('Ativo', default=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Alerta Climático'
        verbose_name_plural = 'Alertas Climáticos'
        ordering = ['-severity', '-created_at']


class WeatherService:
    """Service for fetching weather data from OpenWeather"""
    
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    CACHE_TTL = 600  # 10 minutes
    
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
    
    def get_current(self, city: City) -> dict:
        """Get current weather for a city"""
        cache_key = f"weather_current_{city.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        url = f"{self.BASE_URL}/weather"
        params = {
            'lat': float(city.latitude),
            'lon': float(city.longitude),
            'appid': self.api_key,
            'units': 'metric',
            'lang': 'pt_br'
        }
        
        try:
            with httpx.Client() as client:
                response = client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                result = self._parse_current(data)
                cache.set(cache_key, result, self.CACHE_TTL)
                
                # Save to database
                self._save_weather_data(city, result)
                
                return result
                
        except httpx.HTTPError as e:
            # Return last cached data if available
            try:
                last_data = WeatherData.objects.filter(city=city).latest()
                return self._data_to_dict(last_data)
            except WeatherData.DoesNotExist:
                return {'error': str(e)}
    
    def get_forecast(self, city: City) -> list:
        """Get 5-day forecast for a city"""
        cache_key = f"weather_forecast_{city.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        url = f"{self.BASE_URL}/forecast"
        params = {
            'lat': float(city.latitude),
            'lon': float(city.longitude),
            'appid': self.api_key,
            'units': 'metric',
            'lang': 'pt_br',
            'cnt': 40  # 5 days * 8 (3-hour intervals)
        }
        
        try:
            with httpx.Client() as client:
                response = client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                result = self._parse_forecast(data)
                cache.set(cache_key, result, self.CACHE_TTL * 3)  # 30 min cache
                
                return result
                
        except httpx.HTTPError as e:
            return {'error': str(e)}
    
    def _parse_current(self, data: dict) -> dict:
        """Parse OpenWeather current response"""
        main = data.get('main', {})
        weather = data.get('weather', [{}])[0]
        wind = data.get('wind', {})
        sys = data.get('sys', {})
        
        return {
            'temperature': main.get('temp'),
            'feels_like': main.get('feels_like'),
            'temp_min': main.get('temp_min'),
            'temp_max': main.get('temp_max'),
            'humidity': main.get('humidity'),
            'pressure': main.get('pressure'),
            'description': weather.get('description', '').capitalize(),
            'icon': weather.get('icon'),
            'icon_url': f"https://openweathermap.org/img/wn/{weather.get('icon', '01d')}@2x.png",
            'wind_speed': wind.get('speed'),
            'wind_direction': wind.get('deg'),
            'visibility': data.get('visibility'),
            'clouds': data.get('clouds', {}).get('all'),
            'sunrise': datetime.fromtimestamp(sys.get('sunrise', 0)).isoformat() if sys.get('sunrise') else None,
            'sunset': datetime.fromtimestamp(sys.get('sunset', 0)).isoformat() if sys.get('sunset') else None,
            'fetched_at': datetime.now().isoformat()
        }
    
    def _parse_forecast(self, data: dict) -> list:
        """Parse OpenWeather forecast response"""
        forecasts = []
        for item in data.get('list', []):
            main = item.get('main', {})
            weather = item.get('weather', [{}])[0]
            
            forecasts.append({
                'datetime': item.get('dt_txt'),
                'timestamp': item.get('dt'),
                'temperature': main.get('temp'),
                'feels_like': main.get('feels_like'),
                'temp_min': main.get('temp_min'),
                'temp_max': main.get('temp_max'),
                'humidity': main.get('humidity'),
                'description': weather.get('description', '').capitalize(),
                'icon': weather.get('icon'),
                'icon_url': f"https://openweathermap.org/img/wn/{weather.get('icon', '01d')}@2x.png",
                'pop': item.get('pop', 0) * 100,  # Probability of precipitation
            })
        
        return forecasts
    
    def _save_weather_data(self, city: City, data: dict):
        """Save weather data to database"""
        WeatherData.objects.create(
            city=city,
            temperature=data.get('temperature', 0),
            feels_like=data.get('feels_like', 0),
            humidity=data.get('humidity', 0),
            pressure=data.get('pressure', 0),
            wind_speed=data.get('wind_speed', 0),
            wind_direction=data.get('wind_direction', 0),
            description=data.get('description', ''),
            icon=data.get('icon', ''),
            visibility=data.get('visibility'),
            clouds=data.get('clouds'),
        )
    
    def _data_to_dict(self, data: WeatherData) -> dict:
        """Convert WeatherData model to dict"""
        return {
            'temperature': float(data.temperature),
            'feels_like': float(data.feels_like),
            'humidity': data.humidity,
            'pressure': data.pressure,
            'wind_speed': float(data.wind_speed),
            'wind_direction': data.wind_direction,
            'description': data.description,
            'icon': data.icon,
            'icon_url': f"https://openweathermap.org/img/wn/{data.icon}@2x.png",
            'visibility': data.visibility,
            'clouds': data.clouds,
            'fetched_at': data.fetched_at.isoformat()
        }
