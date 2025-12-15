"""Navigation Views"""
from rest_framework import views, permissions, status
from rest_framework.response import Response
from .models import RouteService, RouteSearch
from apps.totems.models import Totem


class RouteView(views.APIView):
    """Calculate route between two points"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Debug logging
        print(f"[DEBUG] RouteView received request.data: {request.data}")
        print(f"[DEBUG] RouteView content_type: {request.content_type}")
        import sys
        sys.stdout.flush()

        origin_lat = request.data.get('origin_lat')
        origin_lng = request.data.get('origin_lng')
        dest_lat = request.data.get('destination_lat')
        dest_lng = request.data.get('destination_lng')
        dest_name = request.data.get('destination_name', '')
        mode = request.data.get('mode', 'walking')
        totem_id = request.data.get('totem_id')

        print(f"[DEBUG] Parsed values: origin=({origin_lat}, {origin_lng}), dest=({dest_lat}, {dest_lng})")
        sys.stdout.flush()

        if not all([origin_lat, origin_lng, dest_lat, dest_lng]):
            return Response(
                {'error': 'origin and destination coordinates required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = RouteService()
        result = service.get_route(
            origin=(origin_lat, origin_lng),
            destination=(dest_lat, dest_lng),
            mode=mode
        )
        
        # Log search for analytics
        if totem_id and result.get('success'):
            try:
                totem = Totem.objects.get(id=totem_id)
                RouteSearch.objects.create(
                    totem=totem,
                    origin_lat=origin_lat,
                    origin_lng=origin_lng,
                    destination_lat=dest_lat,
                    destination_lng=dest_lng,
                    destination_name=dest_name,
                    transport_mode=mode,
                    distance_meters=result.get('distance'),
                    duration_seconds=result.get('duration')
                )
            except Totem.DoesNotExist:
                pass
        
        return Response(result)


class MultiRouteView(views.APIView):
    """Calculate routes for all transport modes"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        origin_lat = request.data.get('origin_lat')
        origin_lng = request.data.get('origin_lng')
        dest_lat = request.data.get('destination_lat')
        dest_lng = request.data.get('destination_lng')
        
        if not all([origin_lat, origin_lng, dest_lat, dest_lng]):
            return Response(
                {'error': 'origin and destination coordinates required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = RouteService()
        modes = ['walking', 'driving', 'cycling']
        results = {}
        
        for mode in modes:
            results[mode] = service.get_route(
                origin=(origin_lat, origin_lng),
                destination=(dest_lat, dest_lng),
                mode=mode
            )
        
        return Response(results)


class GeocodeView(views.APIView):
    """Search for places by name"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query or len(query) < 3:
            return Response(
                {'error': 'query must be at least 3 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        city = getattr(request, 'city', None)
        service = RouteService()
        results = service.geocode(query, city)
        
        return Response({'results': results})


class QRCodeView(views.APIView):
    """Generate QR code for route"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        dest_lat = request.data.get('destination_lat')
        dest_lng = request.data.get('destination_lng')
        dest_name = request.data.get('destination_name', 'Destination')
        
        if not all([dest_lat, dest_lng]):
            return Response(
                {'error': 'destination coordinates required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate Google Maps URL for mobile
        maps_url = f"https://www.google.com/maps/dir/?api=1&destination={dest_lat},{dest_lng}&destination_place_id={dest_name}"
        
        service = RouteService()
        qr_base64 = service.generate_qr_code(maps_url)
        
        return Response({
            'qr_code': f"data:image/png;base64,{qr_base64}",
            'maps_url': maps_url
        })
