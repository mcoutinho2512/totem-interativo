"""
Totem Serializers
"""
from rest_framework import serializers
from .models import Totem, TotemSession


class TotemSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    logo = serializers.ImageField(required=False, allow_null=True)
    background_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Totem
        fields = [
            'id', 'city', 'city_name', 'name', 'identifier',
            'address', 'neighborhood', 'latitude', 'longitude',
            'screen_orientation', 'brightness', 'volume', 'session_timeout',
            'logo', 'background_image', 'background_color',
            'status', 'last_heartbeat', 'last_ip',
            'installed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_heartbeat', 'last_ip', 'created_at', 'updated_at']


class TotemPublicSerializer(serializers.ModelSerializer):
    """For totem self-identification"""
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_slug = serializers.CharField(source='city.slug', read_only=True)

    class Meta:
        model = Totem
        fields = [
            'id', 'name', 'identifier', 'city', 'city_name', 'city_slug',
            'address', 'neighborhood', 'latitude', 'longitude',
            'screen_orientation', 'brightness', 'volume', 'session_timeout',
            'logo', 'background_image', 'background_color'
        ]


class TotemSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TotemSession
        fields = '__all__'
        read_only_fields = ['id', 'started_at']
