"""
Tenant Serializers
"""
from rest_framework import serializers
from .models import City, CityAdmin


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = [
            'id', 'name', 'slug', 'state', 'country',
            'latitude', 'longitude', 'timezone',
            'logo', 'primary_color', 'secondary_color',
            'default_language', 'available_languages',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CityPublicSerializer(serializers.ModelSerializer):
    """Serializer for public/totem access"""
    class Meta:
        model = City
        fields = [
            'id', 'name', 'slug', 'state',
            'latitude', 'longitude', 'timezone',
            'logo', 'primary_color', 'secondary_color',
            'default_language', 'available_languages'
        ]


class CityAdminSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = CityAdmin
        fields = ['id', 'user', 'user_email', 'user_name', 'city', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
