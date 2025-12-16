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

    # Customization / Branding
    THEME_CHOICES = [
        ('player', 'Player (Somente Anúncios)'),
        ('tomipro', 'TOMI Pro (Completo)'),
        ('tomi', 'TOMI (Clássico)'),
        ('dashboard', 'Dashboard'),
        ('touch', 'Touch'),
        ('simple', 'Simples'),
    ]

    theme = models.CharField('Layout/Tema', max_length=20, choices=THEME_CHOICES, default='player',
                             help_text='Layout visual do totem')
    logo = models.ImageField('Logo', upload_to='totems/logos/', null=True, blank=True,
                             help_text='Logo PNG para exibir no cabeçalho (substitui o nome da cidade)')
    background_image = models.ImageField('Imagem de Fundo', upload_to='totems/backgrounds/', null=True, blank=True,
                                         help_text='Imagem de fundo para área de interação')
    background_color = models.CharField('Cor de Fundo', max_length=100, blank=True, default='',
                                        help_text='Gradiente CSS ou cor sólida (ex: linear-gradient(135deg, #1a1a2e, #16213e))')
    
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


class ContentBlock(models.Model):
    """Customizable content blocks for totem display"""
    POSITION_CHOICES = [
        (1, 'Superior Esquerdo'),
        (2, 'Superior Direito'),
        (3, 'Inferior Esquerdo'),
        (4, 'Inferior Direito'),
    ]

    BLOCK_TYPE_CHOICES = [
        ('featured_event', 'Evento em Destaque'),
        ('events_list', 'Lista de Eventos'),
        ('news', 'Notícias'),
        ('pois', 'Pontos de Interesse'),
        ('weather', 'Clima'),
        ('map', 'Mapa'),
        ('custom', 'Conteúdo Personalizado'),
        ('image', 'Imagem'),
        ('video', 'Vídeo'),
    ]

    totem = models.ForeignKey(Totem, on_delete=models.CASCADE, related_name='content_blocks')
    position = models.IntegerField('Posição', choices=POSITION_CHOICES)
    block_type = models.CharField('Tipo de Bloco', max_length=30, choices=BLOCK_TYPE_CHOICES)

    # Customization
    title = models.CharField('Título', max_length=200, blank=True, default='')
    subtitle = models.CharField('Subtítulo', max_length=300, blank=True, default='')
    background_color = models.CharField('Cor de Fundo', max_length=50, blank=True, default='#ffffff')
    text_color = models.CharField('Cor do Texto', max_length=50, blank=True, default='#000000')

    # Content
    image = models.ImageField('Imagem', upload_to='totems/blocks/', null=True, blank=True)
    content_html = models.TextField('Conteúdo HTML', blank=True, default='',
                                    help_text='HTML personalizado para blocos do tipo "custom"')
    link_url = models.URLField('Link', blank=True, default='')

    # Data source config (JSON)
    config = models.JSONField('Configuração', default=dict, blank=True,
                              help_text='Configurações específicas do tipo de bloco (ex: limite de itens, filtros)')

    # Display options
    is_active = models.BooleanField('Ativo', default=True)
    order = models.IntegerField('Ordem', default=0, help_text='Para ordenação dentro da mesma posição')

    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        verbose_name = 'Bloco de Conteúdo'
        verbose_name_plural = 'Blocos de Conteúdo'
        ordering = ['totem', 'position', 'order']
        unique_together = ['totem', 'position']

    def __str__(self):
        return f"{self.totem.name} - Posição {self.position} ({self.get_block_type_display()})"
