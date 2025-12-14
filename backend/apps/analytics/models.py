"""Analytics Models"""
from django.db import models
from apps.tenants.models import City
from apps.totems.models import Totem


class DailyStats(models.Model):
    """Daily aggregated statistics per totem"""
    totem = models.ForeignKey(Totem, on_delete=models.CASCADE, related_name='daily_stats')
    date = models.DateField('Data')
    
    sessions_count = models.IntegerField('Sessões', default=0)
    interactions_count = models.IntegerField('Interações', default=0)
    routes_searched = models.IntegerField('Rotas Pesquisadas', default=0)
    avg_session_duration = models.IntegerField('Duração Média (s)', default=0)
    
    # Peak hours
    peak_hour = models.IntegerField('Horário de Pico', null=True)
    
    class Meta:
        verbose_name = 'Estatística Diária'
        verbose_name_plural = 'Estatísticas Diárias'
        unique_together = ['totem', 'date']
        ordering = ['-date']


class PopularDestination(models.Model):
    """Most searched destinations"""
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='popular_destinations')
    
    destination_name = models.CharField('Destino', max_length=500)
    latitude = models.DecimalField('Latitude', max_digits=10, decimal_places=7)
    longitude = models.DecimalField('Longitude', max_digits=10, decimal_places=7)
    
    search_count = models.IntegerField('Pesquisas', default=0)
    last_searched = models.DateTimeField('Última Pesquisa', auto_now=True)
    
    class Meta:
        verbose_name = 'Destino Popular'
        verbose_name_plural = 'Destinos Populares'
        ordering = ['-search_count']
