"""
Totem Models
"""
from django.db import models
from django.contrib.gis.db import models as gis_models
from apps.tenants.models import City


class Totem(models.Model):
    """Physical totem device"""
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('inactive', 'Inativo'),
        ('maintenance', 'Em Manutenção'),
        ('offline', 'Offline'),
    ]
    
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='totems')
    name = models.CharField('Nome', max_length=200)
    identifier = models.CharField('Identificador', max_length=50, unique=True)
    
    # Location
    address = models.CharField('Endereço', max_length=500)
    neighborhood = models.CharField('Bairro', max_length=200)
    latitude = models.DecimalField('Latitude', max_digits=10, decimal_places=7)
    longitude = models.DecimalField('Longitude', max_digits=10, decimal_places=7)
    location = gis_models.PointField('Localização', null=True, blank=True)
    
    # Configuration
    screen_orientation = models.CharField('Orientação', max_length=20, default='portrait',
                                          choices=[('portrait', 'Retrato'), ('landscape', 'Paisagem')])
    brightness = models.IntegerField('Brilho (%)', default=80)
    volume = models.IntegerField('Volume (%)', default=50)
    session_timeout = models.IntegerField('Timeout (segundos)', default=60)
    
    # Status
    status = models.CharField('Status', max_length=20, choices=STATUS_CHOICES, default='active')
    last_heartbeat = models.DateTimeField('Último Heartbeat', null=True, blank=True)
    last_ip = models.GenericIPAddressField('Último IP', null=True, blank=True)
    
    # Metadata
    installed_at = models.DateField('Instalado em', null=True, blank=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Totem'
        verbose_name_plural = 'Totems'
        ordering = ['city', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.city.name})"


class TotemSession(models.Model):
    """Track totem usage sessions"""
    totem = models.ForeignKey(Totem, on_delete=models.CASCADE, related_name='sessions')
    session_id = models.CharField('Session ID', max_length=100)
    
    started_at = models.DateTimeField('Iniciada em', auto_now_add=True)
    ended_at = models.DateTimeField('Finalizada em', null=True, blank=True)
    
    language = models.CharField('Idioma', max_length=10, default='pt-BR')
    interactions_count = models.IntegerField('Interações', default=0)
    
    class Meta:
        verbose_name = 'Sessão do Totem'
        verbose_name_plural = 'Sessões dos Totems'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Session {self.session_id} - {self.totem.name}"
