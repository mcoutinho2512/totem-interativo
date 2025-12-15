"""Content Views"""
from django.db import models
from django.utils import timezone
from django.core.files.storage import default_storage
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime

from .models import Category, News, Event, GalleryImage, PointOfInterest
from .serializers import (
    CategorySerializer, NewsSerializer, EventSerializer,
    GalleryImageSerializer, PointOfInterestSerializer
)
from .utils import (
    validate_file_size, validate_file_type, generate_unique_filename,
    resize_image, create_thumbnail, process_image_for_resolution,
    is_image, is_video, ALLOWED_IMAGE_TYPES, RESOLUTION_PRESETS
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


# ============================================
# Upload Views
# ============================================

class FileUploadView(APIView):
    """
    Generic file upload endpoint
    POST /api/v1/content/upload/
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]  # TODO: Add auth in production

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Nenhum arquivo enviado'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size
        is_valid, error = validate_file_size(file)
        if not is_valid:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        is_valid, error = validate_file_type(file)
        if not is_valid:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique filename
        filename = generate_unique_filename(file.name)

        # Determine upload path
        upload_type = request.data.get('type', 'general')
        upload_path = f'uploads/{upload_type}/{filename}'

        # Process image if applicable
        resize_to = request.data.get('resize')
        if is_image(file) and resize_to:
            preset = RESOLUTION_PRESETS.get(resize_to, RESOLUTION_PRESETS['standard'])
            file = resize_image(file, preset)
            upload_path = upload_path.replace('.', '_resized.')

        # Save file
        saved_path = default_storage.save(upload_path, file)
        file_url = default_storage.url(saved_path)

        return Response({
            'success': True,
            'file_url': file_url,
            'file_path': saved_path,
            'filename': filename,
            'size': file.size,
            'content_type': file.content_type,
        }, status=status.HTTP_201_CREATED)


class GalleryUploadView(APIView):
    """
    Upload images to gallery
    POST /api/v1/content/gallery/upload/
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        files = request.FILES.getlist('files')
        city_id = request.data.get('city_id')

        if not files:
            return Response({'error': 'Nenhum arquivo enviado'}, status=status.HTTP_400_BAD_REQUEST)

        if not city_id:
            return Response({'error': 'city_id é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded = []
        errors = []

        for file in files:
            # Validate file
            is_valid, error = validate_file_size(file)
            if not is_valid:
                errors.append({'file': file.name, 'error': error})
                continue

            is_valid, error = validate_file_type(file, ALLOWED_IMAGE_TYPES)
            if not is_valid:
                errors.append({'file': file.name, 'error': error})
                continue

            try:
                # Resize image for gallery
                file.seek(0)
                resized = resize_image(file, RESOLUTION_PRESETS['fullhd'])

                # Create thumbnail
                file.seek(0)
                thumbnail = create_thumbnail(file, 'medium')

                # Generate filename
                filename = generate_unique_filename(file.name)

                # Get next order number
                max_order = GalleryImage.objects.filter(city_id=city_id).aggregate(
                    max_order=models.Max('order')
                )['max_order'] or 0

                # Create gallery image
                gallery_image = GalleryImage.objects.create(
                    city_id=city_id,
                    title=request.data.get('title', file.name),
                    description=request.data.get('description', ''),
                    image=resized,
                    order=max_order + 1,
                    is_active=True,
                )

                uploaded.append({
                    'id': gallery_image.id,
                    'title': gallery_image.title,
                    'image_url': gallery_image.image.url if gallery_image.image else None,
                    'order': gallery_image.order,
                })

            except Exception as e:
                errors.append({'file': file.name, 'error': str(e)})

        return Response({
            'success': True,
            'uploaded': uploaded,
            'uploaded_count': len(uploaded),
            'errors': errors,
            'error_count': len(errors),
        }, status=status.HTTP_201_CREATED if uploaded else status.HTTP_400_BAD_REQUEST)


class BulkUploadView(APIView):
    """
    Bulk upload with processing options
    POST /api/v1/content/bulk-upload/
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.tenants.models import City

        files = request.FILES.getlist('files')
        generate_thumbnails = request.data.get('generate_thumbnails', 'true').lower() == 'true'
        upload_type = request.data.get('type', 'gallery')  # Default to gallery

        if not files:
            return Response({'error': 'Nenhum arquivo enviado'}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        city = City.objects.first()

        for file in files:
            result = {'original_name': file.name}

            # Validate
            is_valid, error = validate_file_size(file)
            if not is_valid:
                result['error'] = error
                results.append(result)
                continue

            is_valid, error = validate_file_type(file)
            if not is_valid:
                result['error'] = error
                results.append(result)
                continue

            try:
                # For gallery uploads, create GalleryImage records
                if upload_type == 'gallery' and is_image(file):
                    # Get title from filename (without extension)
                    title = file.name.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()

                    gallery_image = GalleryImage.objects.create(
                        city=city,
                        title=title,
                        image=file,
                        is_active=True
                    )
                    result['id'] = gallery_image.id
                    result['original'] = request.build_absolute_uri(gallery_image.image.url)
                    result['success'] = True
                else:
                    # Generic file upload
                    filename = generate_unique_filename(file.name)
                    base_path = f'uploads/{upload_type}'

                    # Save original
                    original_path = f'{base_path}/original/{filename}'
                    saved_path = default_storage.save(original_path, file)
                    result['original'] = default_storage.url(saved_path)

                    # Process image
                    if is_image(file) and generate_thumbnails:
                        file.seek(0)
                        processed = process_image_for_resolution(file)

                        result['variants'] = {}
                        for variant_name, variant_file in processed.items():
                            variant_path = f'{base_path}/{variant_name}/{filename}'
                            variant_saved = default_storage.save(variant_path, variant_file)
                            result['variants'][variant_name] = default_storage.url(variant_saved)

                    result['success'] = True

            except Exception as e:
                result['error'] = str(e)
                result['success'] = False

            results.append(result)

        success_count = sum(1 for r in results if r.get('success'))

        return Response({
            'total': len(files),
            'success_count': success_count,
            'error_count': len(files) - success_count,
            'results': results,
        }, status=status.HTTP_201_CREATED if success_count else status.HTTP_400_BAD_REQUEST)
