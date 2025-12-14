"""
Playlist/Programming Models for Digital Signage
"""
from django.db import models
from apps.tenants.models import City
from apps.totems.models import Totem


class Playlist(models.Model):
    """Uma programação/playlist de conteúdo"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='playlists')
    
    name = models.CharField('Nome', max_length=200)
    description = models.TextField('Descrição', blank=True)
    
    start_time = models.TimeField('Hora Início', null=True, blank=True)
    end_time = models.TimeField('Hora Fim', null=True, blank=True)
    weekdays = models.JSONField('Dias da Semana', default=list)
    
    totems = models.ManyToManyField(Totem, blank=True, related_name='playlists')
    all_totems = models.BooleanField('Todos os Totems', default=True)
    
    is_active = models.BooleanField('Ativo', default=True)
    is_default = models.BooleanField('Padrão', default=False)
    priority = models.IntegerField('Prioridade', default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Playlist'
        verbose_name_plural = 'Playlists'
        ordering = ['-priority', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.city.name})"
    
    def get_total_duration(self):
        return sum(item.duration for item in self.items.filter(is_active=True))


class PlaylistItem(models.Model):
    ITEM_TYPES = [
        ('image', 'Imagem'),
        ('video', 'Vídeo'),
        ('ad', 'Publicidade'),
        ('weather', 'Clima'),
        ('news', 'Notícias'),
        ('events', 'Eventos'),
        ('rss', 'Feed RSS'),
        ('html', 'HTML Personalizado'),
        ('clock', 'Relógio'),
    ]
    
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField('Tipo', max_length=20, choices=ITEM_TYPES)
    name = models.CharField('Nome', max_length=200)
    
    image = models.ImageField('Imagem', upload_to='playlist/', null=True, blank=True)
    video_url = models.URLField('URL do Vídeo', blank=True)
    content_url = models.URLField('URL do Conteúdo', blank=True)
    html_content = models.TextField('Conteúdo HTML', blank=True)
    
    duration = models.IntegerField('Duração (segundos)', default=10)
    transition = models.CharField('Transição', max_length=20, default='fade')
    background_color = models.CharField('Cor de Fundo', max_length=7, default='#000000')
    text_color = models.CharField('Cor do Texto', max_length=7, default='#ffffff')
    
    order = models.IntegerField('Ordem', default=0)
    is_active = models.BooleanField('Ativo', default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Item da Playlist'
        verbose_name_plural = 'Itens da Playlist'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.name} ({self.get_item_type_display()})"


class RSSFeed(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='rss_feeds')
    name = models.CharField('Nome', max_length=200)
    url = models.URLField('URL do Feed')
    last_fetched = models.DateTimeField(null=True, blank=True)
    cached_content = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Feed RSS'
        verbose_name_plural = 'Feeds RSS'
    
    def __str__(self):
        return self.name
