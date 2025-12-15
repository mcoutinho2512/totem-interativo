"""
Content Models - News, Events, Images, POIs
"""
from django.db import models
from django.contrib.gis.db import models as gis_models
from apps.tenants.models import City


class Category(models.Model):
    """Content category"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField('Nome', max_length=100)
    slug = models.SlugField('Slug')
    icon = models.CharField('Ícone', max_length=50, blank=True)
    color = models.CharField('Cor', max_length=7, default='#3182ce')
    order = models.IntegerField('Ordem', default=0)
    is_active = models.BooleanField('Ativo', default=True)
    
    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['order', 'name']
        unique_together = ['city', 'slug']
    
    def __str__(self):
        return f"{self.name} ({self.city.name})"


class News(models.Model):
    """News articles"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='news')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    title = models.CharField('Título', max_length=300)
    subtitle = models.CharField('Subtítulo', max_length=500, blank=True)
    content = models.TextField('Conteúdo')
    image = models.ImageField('Imagem', upload_to='news/', null=True, blank=True)
    
    is_featured = models.BooleanField('Destaque', default=False)
    is_published = models.BooleanField('Publicado', default=True)
    
    publish_at = models.DateTimeField('Publicar em')
    expires_at = models.DateTimeField('Expira em', null=True, blank=True)
    
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Notícia'
        verbose_name_plural = 'Notícias'
        ordering = ['-publish_at']
    
    def __str__(self):
        return self.title


class Event(models.Model):
    """Events and activities"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='events')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    title = models.CharField('Título', max_length=300)
    description = models.TextField('Descrição', blank=True)
    image = models.ImageField('Imagem', upload_to='events/', null=True, blank=True)
    
    # Location
    venue = models.CharField('Local', max_length=300, blank=True)
    address = models.CharField('Endereço', max_length=500, blank=True)
    latitude = models.DecimalField('Latitude', max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField('Longitude', max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Date/Time
    start_date = models.DateTimeField('Data Início')
    end_date = models.DateTimeField('Data Fim', null=True, blank=True)
    is_all_day = models.BooleanField('Dia Inteiro', default=False)
    
    # Details
    price = models.CharField('Preço', max_length=100, blank=True, default='Gratuito')
    url = models.URLField('Link', blank=True)
    
    is_featured = models.BooleanField('Destaque', default=False)
    is_published = models.BooleanField('Publicado', default=True)
    
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['start_date']
    
    def __str__(self):
        return self.title


class GalleryImage(models.Model):
    """Image gallery for carousel"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='gallery_images')
    
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descrição', blank=True)
    image = models.ImageField('Imagem', upload_to='gallery/')
    
    order = models.IntegerField('Ordem', default=0)
    is_active = models.BooleanField('Ativo', default=True)
    
    display_start = models.DateTimeField('Exibir a partir de', null=True, blank=True)
    display_end = models.DateTimeField('Exibir até', null=True, blank=True)
    
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Imagem da Galeria'
        verbose_name_plural = 'Imagens da Galeria'
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.city.name})"


class PointOfInterest(models.Model):
    """Points of Interest - restaurants, hotels, services, etc."""
    POI_TYPES = [
        ('restaurant', 'Restaurante'),
        ('hotel', 'Hotel'),
        ('attraction', 'Atração Turística'),
        ('shopping', 'Compras'),
        ('hospital', 'Hospital'),
        ('pharmacy', 'Farmácia'),
        ('police', 'Polícia'),
        ('transport', 'Transporte'),
        ('bank', 'Banco'),
        ('other', 'Outro'),
    ]
    
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='pois')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    name = models.CharField('Nome', max_length=200)
    poi_type = models.CharField('Tipo', max_length=20, choices=POI_TYPES)
    description = models.TextField('Descrição', blank=True)
    image = models.ImageField('Imagem', upload_to='pois/', null=True, blank=True)
    
    # Location
    address = models.CharField('Endereço', max_length=500)
    neighborhood = models.CharField('Bairro', max_length=200, blank=True)
    latitude = models.DecimalField('Latitude', max_digits=10, decimal_places=7)
    longitude = models.DecimalField('Longitude', max_digits=10, decimal_places=7)
    location = gis_models.PointField('Localização', null=True, blank=True)
    
    # Contact
    phone = models.CharField('Telefone', max_length=20, blank=True)
    website = models.URLField('Website', blank=True)
    
    # Hours
    opening_hours = models.JSONField('Horário de Funcionamento', default=dict, blank=True)
    
    is_featured = models.BooleanField('Destaque', default=False)
    is_active = models.BooleanField('Ativo', default=True)
    
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Ponto de Interesse'
        verbose_name_plural = 'Pontos de Interesse'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.poi_type})"


# Import playlist models
from .models_playlist import Playlist, PlaylistItem, RSSFeed
