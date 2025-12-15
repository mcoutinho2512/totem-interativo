"""Content Serializers"""
from rest_framework import serializers
from .models import Category, News, Event, GalleryImage, PointOfInterest
from apps.tenants.models import City


class CategorySerializer(serializers.ModelSerializer):
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), required=False)

    class Meta:
        model = Category
        fields = ['id', 'city', 'name', 'slug', 'icon', 'color', 'order', 'is_active']

    def create(self, validated_data):
        if 'city' not in validated_data:
            validated_data['city'] = City.objects.first()
        return super().create(validated_data)


class NewsSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)

    class Meta:
        model = News
        fields = [
            'id', 'city', 'category', 'category_name',
            'title', 'subtitle', 'content', 'image',
            'is_featured', 'is_published',
            'publish_at', 'expires_at',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        if 'city' not in validated_data:
            validated_data['city'] = City.objects.first()
        return super().create(validated_data)


class EventSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            'id', 'city', 'category', 'category_name',
            'title', 'description', 'image',
            'venue', 'address', 'latitude', 'longitude',
            'start_date', 'end_date', 'is_all_day',
            'price', 'url',
            'is_featured', 'is_published',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        if 'city' not in validated_data:
            validated_data['city'] = City.objects.first()
        return super().create(validated_data)


class GalleryImageSerializer(serializers.ModelSerializer):
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), required=False)
    image = serializers.ImageField(required=False)

    class Meta:
        model = GalleryImage
        fields = [
            'id', 'city', 'title', 'description', 'image',
            'order', 'is_active', 'display_start', 'display_end', 'created_at'
        ]

    def create(self, validated_data):
        if 'city' not in validated_data:
            validated_data['city'] = City.objects.first()
        return super().create(validated_data)


class PointOfInterestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    poi_type_display = serializers.CharField(source='get_poi_type_display', read_only=True)
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)

    class Meta:
        model = PointOfInterest
        fields = [
            'id', 'city', 'category', 'category_name',
            'name', 'poi_type', 'poi_type_display', 'description', 'image',
            'address', 'neighborhood', 'latitude', 'longitude',
            'phone', 'website', 'opening_hours',
            'is_featured', 'is_active',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        if 'city' not in validated_data:
            validated_data['city'] = City.objects.first()
        return super().create(validated_data)


# Playlist Serializers
from .models_playlist import Playlist, PlaylistItem, RSSFeed

class PlaylistItemSerializer(serializers.ModelSerializer):
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    
    class Meta:
        model = PlaylistItem
        fields = [
            'id', 'item_type', 'item_type_display', 'name',
            'image', 'video_url', 'content_url', 'html_content',
            'duration', 'transition', 'background_color', 'text_color',
            'order', 'is_active'
        ]


class PlaylistSerializer(serializers.ModelSerializer):
    items = PlaylistItemSerializer(many=True, read_only=True)
    total_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = [
            'id', 'name', 'description',
            'start_time', 'end_time', 'weekdays',
            'is_active', 'is_default', 'priority',
            'items', 'total_duration'
        ]
    
    def get_total_duration(self, obj):
        return obj.get_total_duration()


class RSSFeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSSFeed
        fields = ['id', 'name', 'url', 'cached_content', 'is_active', 'last_fetched']


# Playlist Serializers
from .models_playlist import Playlist, PlaylistItem, RSSFeed

class PlaylistItemSerializer(serializers.ModelSerializer):
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    
    class Meta:
        model = PlaylistItem
        fields = [
            'id', 'item_type', 'item_type_display', 'name',
            'image', 'video_url', 'content_url', 'html_content',
            'duration', 'transition', 'background_color', 'text_color',
            'order', 'is_active'
        ]


class PlaylistSerializer(serializers.ModelSerializer):
    items = PlaylistItemSerializer(many=True, read_only=True)
    total_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = [
            'id', 'name', 'description',
            'start_time', 'end_time', 'weekdays',
            'is_active', 'is_default', 'priority',
            'items', 'total_duration'
        ]
    
    def get_total_duration(self, obj):
        return obj.get_total_duration()


class RSSFeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSSFeed
        fields = ['id', 'name', 'url', 'cached_content', 'is_active', 'last_fetched']
