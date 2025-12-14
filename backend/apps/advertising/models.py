"""Advertising Models"""
from django.db import models
from apps.tenants.models import City
from apps.totems.models import Totem


class Advertiser(models.Model):
    """Advertisers/Companies"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='advertisers')
    name = models.CharField('Nome', max_length=200)
    contact_email = models.EmailField('Email')
    contact_phone = models.CharField('Telefone', max_length=20, blank=True)
    is_active = models.BooleanField('Ativo', default=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Anunciante'
        verbose_name_plural = 'Anunciantes'
    
    def __str__(self):
        return self.name


class Campaign(models.Model):
    """Advertising campaigns"""
    STATUS_CHOICES = [
        ('draft', 'Rascunho'),
        ('scheduled', 'Agendada'),
        ('active', 'Ativa'),
        ('paused', 'Pausada'),
        ('ended', 'Finalizada'),
    ]
    
    advertiser = models.ForeignKey(Advertiser, on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField('Nome', max_length=200)
    
    status = models.CharField('Status', max_length=20, choices=STATUS_CHOICES, default='draft')
    
    start_date = models.DateTimeField('Início')
    end_date = models.DateTimeField('Fim')
    
    # Targeting
    totems = models.ManyToManyField(Totem, blank=True, related_name='campaigns')
    all_totems = models.BooleanField('Todos os Totems', default=True)
    
    # Schedule
    schedule = models.JSONField('Horários', default=dict, blank=True)
    
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Campanha'
        verbose_name_plural = 'Campanhas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.advertiser.name})"


class AdCreative(models.Model):
    """Ad creatives/media"""
    TYPE_CHOICES = [
        ('image', 'Imagem'),
        ('video', 'Vídeo'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='creatives')
    name = models.CharField('Nome', max_length=200)
    ad_type = models.CharField('Tipo', max_length=20, choices=TYPE_CHOICES)
    
    file = models.FileField('Arquivo', upload_to='ads/')
    duration = models.IntegerField('Duração (s)', default=10)
    
    click_url = models.URLField('URL de Clique', blank=True)
    
    is_active = models.BooleanField('Ativo', default=True)
    order = models.IntegerField('Ordem', default=0)
    
    class Meta:
        verbose_name = 'Criativo'
        verbose_name_plural = 'Criativos'
        ordering = ['order']
    
    def __str__(self):
        return self.name


class AdImpression(models.Model):
    """Track ad impressions"""
    creative = models.ForeignKey(AdCreative, on_delete=models.CASCADE, related_name='impressions')
    totem = models.ForeignKey(Totem, on_delete=models.CASCADE, related_name='ad_impressions')
    displayed_at = models.DateTimeField('Exibido em', auto_now_add=True)
    duration_viewed = models.IntegerField('Tempo Visualizado (s)', default=0)
    
    class Meta:
        verbose_name = 'Impressão'
        verbose_name_plural = 'Impressões'
        ordering = ['-displayed_at']
