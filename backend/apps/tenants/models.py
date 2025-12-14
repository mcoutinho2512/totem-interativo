"""
Tenant (City) Models - Multi-tenant support
"""
from django.db import models
from django.contrib.auth.models import User
from django.contrib.gis.db import models as gis_models


class City(models.Model):
    """Represents a city/municipality (tenant)"""
    name = models.CharField('Nome', max_length=200)
    slug = models.SlugField('Slug', unique=True)
    state = models.CharField('Estado', max_length=2)
    country = models.CharField('País', max_length=100, default='Brasil')
    
    # Location
    latitude = models.DecimalField('Latitude', max_digits=10, decimal_places=7)
    longitude = models.DecimalField('Longitude', max_digits=10, decimal_places=7)
    location = gis_models.PointField('Localização', null=True, blank=True)
    timezone = models.CharField('Fuso Horário', max_length=50, default='America/Sao_Paulo')
    
    # Branding
    logo = models.ImageField('Logo', upload_to='cities/logos/', null=True, blank=True)
    primary_color = models.CharField('Cor Primária', max_length=7, default='#1a365d')
    secondary_color = models.CharField('Cor Secundária', max_length=7, default='#2c5282')
    
    # Settings
    default_language = models.CharField('Idioma Padrão', max_length=5, default='pt-BR')
    available_languages = models.JSONField('Idiomas Disponíveis', default=list)
    
    # Status
    is_active = models.BooleanField('Ativo', default=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Cidade'
        verbose_name_plural = 'Cidades'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.state}"


class CityAdmin(models.Model):
    """City administrators"""
    ROLE_CHOICES = [
        ('owner', 'Proprietário'),
        ('admin', 'Administrador'),
        ('editor', 'Editor'),
        ('viewer', 'Visualizador'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='city_roles')
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='admins')
    role = models.CharField('Papel', max_length=20, choices=ROLE_CHOICES)
    
    is_active = models.BooleanField('Ativo', default=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Administrador da Cidade'
        verbose_name_plural = 'Administradores das Cidades'
        unique_together = ['user', 'city']
    
    def __str__(self):
        return f"{self.user.username} - {self.city.name} ({self.role})"
