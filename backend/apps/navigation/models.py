"""
Navigation Models and Route Service
"""
from django.db import models
from django.conf import settings
from apps.tenants.models import City
from apps.totems.models import Totem
import httpx
import qrcode
from io import BytesIO
import base64


class RouteSearch(models.Model):
    """Log of route searches for analytics"""
    totem = models.ForeignKey(Totem, on_delete=models.CASCADE, related_name='route_searches')
    
    origin_lat = models.DecimalField('Origem Lat', max_digits=10, decimal_places=7)
    origin_lng = models.DecimalField('Origem Lng', max_digits=10, decimal_places=7)
    destination_lat = models.DecimalField('Destino Lat', max_digits=10, decimal_places=7)
    destination_lng = models.DecimalField('Destino Lng', max_digits=10, decimal_places=7)
    destination_name = models.CharField('Nome Destino', max_length=500)
    
    transport_mode = models.CharField('Modo', max_length=20)
    distance_meters = models.IntegerField('Distância (m)', null=True)
    duration_seconds = models.IntegerField('Duração (s)', null=True)
    
    searched_at = models.DateTimeField('Pesquisado em', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Pesquisa de Rota'
        verbose_name_plural = 'Pesquisas de Rotas'
        ordering = ['-searched_at']


class RouteService:
    """Service for route calculations using OpenRouteService"""
    
    BASE_URL = "https://api.openrouteservice.org"
    
    PROFILE_MAP = {
        'walking': 'foot-walking',
        'driving': 'driving-car',
        'cycling': 'cycling-regular',
    }
    
    def __init__(self):
        self.api_key = settings.OPENROUTESERVICE_API_KEY
    
    def get_route(self, origin: tuple, destination: tuple, mode: str = 'walking') -> dict:
        """
        Get route between two points

        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            mode: 'walking', 'driving', or 'cycling'

        Returns:
            Route data with geometry, distance, duration, and steps
        """
        profile = self.PROFILE_MAP.get(mode, 'foot-walking')

        # ORS expects [lng, lat] format
        dest_lng = float(destination[1])
        dest_lat = float(destination[0])
        coordinates = [
            [float(origin[1]), float(origin[0])],
            [dest_lng, dest_lat]
        ]

        # Use GeoJSON endpoint for coordinates in response
        url = f"{self.BASE_URL}/v2/directions/{profile}/geojson"
        headers = {
            'Authorization': self.api_key,
            'Content-Type': 'application/json'
        }
        body = {
            'coordinates': coordinates,
            'instructions': True,
            'language': 'pt',
            'units': 'm'
        }

        try:
            with httpx.Client() as client:
                response = client.post(url, json=body, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()

                if 'features' in data and len(data['features']) > 0:
                    feature = data['features'][0]
                    props = feature.get('properties', {})
                    geometry = feature.get('geometry', {})
                    summary = props.get('summary', {})

                    return {
                        'success': True,
                        'distance': summary.get('distance', 0),
                        'duration': summary.get('duration', 0),
                        'geometry': geometry,
                        'steps': self._parse_steps(props.get('segments', [])),
                        'mode': mode,
                        'destination': {
                            'lat': dest_lat,
                            'lng': dest_lng
                        }
                    }

                return {'success': False, 'error': 'No route found'}

        except httpx.HTTPError as e:
            return {'success': False, 'error': str(e)}
    
    def _parse_steps(self, segments: list) -> list:
        """Parse route segments into readable steps"""
        steps = []
        for segment in segments:
            for step in segment.get('steps', []):
                steps.append({
                    'instruction': step.get('instruction', ''),
                    'distance': step.get('distance', 0),
                    'duration': step.get('duration', 0),
                    'type': step.get('type', 0),
                    'name': step.get('name', '')
                })
        return steps
    
    def geocode(self, query: str, city: City = None) -> list:
        """
        Search for a place by name
        
        Args:
            query: Search string
            city: Optional city to bias results
        
        Returns:
            List of matching places
        """
        url = f"{self.BASE_URL}/geocode/search"
        headers = {'Authorization': self.api_key}
        params = {
            'text': query,
            'size': 5,
            'lang': 'pt'
        }
        
        # Bias to city location if provided
        if city:
            params['focus.point.lat'] = float(city.latitude)
            params['focus.point.lon'] = float(city.longitude)
        
        try:
            with httpx.Client() as client:
                response = client.get(url, params=params, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                results = []
                for feature in data.get('features', []):
                    props = feature.get('properties', {})
                    coords = feature.get('geometry', {}).get('coordinates', [0, 0])
                    results.append({
                        'name': props.get('name', ''),
                        'label': props.get('label', ''),
                        'latitude': coords[1],
                        'longitude': coords[0],
                        'type': props.get('layer', '')
                    })
                
                return results
                
        except httpx.HTTPError:
            return []
    
    def generate_qr_code(self, route_url: str) -> str:
        """Generate QR code for route and return as base64"""
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(route_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
