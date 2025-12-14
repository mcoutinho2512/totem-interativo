"""
Comando para popular dados de demonstração
"""
import urllib.request
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils import timezone
from apps.tenants.models import City
from apps.totems.models import Totem
from apps.content.models import Category, News, Event, GalleryImage, PointOfInterest
from apps.content.models_playlist import Playlist, PlaylistItem


class Command(BaseCommand):
    help = 'Popula o banco com dados de demonstracao'

    def download_image(self, url, name):
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            request = urllib.request.Request(url, headers=headers)
            response = urllib.request.urlopen(request, timeout=15)
            return ContentFile(response.read(), name=name)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Erro ao baixar imagem: {e}'))
            return None

    def handle(self, *args, **options):
        self.stdout.write('Iniciando populacao de dados demo...\n')

        # 1. Criar Cidade
        self.stdout.write('Criando cidade...')
        city, created = City.objects.get_or_create(
            slug='niteroi',
            defaults={
                'name': 'Niteroi',
                'state': 'RJ',
                'country': 'Brasil',
                'latitude': Decimal('-22.8833'),
                'longitude': Decimal('-43.1033'),
                'timezone': 'America/Sao_Paulo',
                'primary_color': '#1a365d',
                'secondary_color': '#ffcc00',
                'is_active': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'  Cidade: {city.name}'))

        # 2. Criar Totem
        self.stdout.write('Criando totem...')
        totem, created = Totem.objects.get_or_create(
            identifier='TOTEM-001',
            defaults={
                'city': city,
                'name': 'Totem Centro - Praca Arariboia',
                'address': 'Praca Arariboia, Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8941'),
                'longitude': Decimal('-43.1244'),
                'status': 'active',
            }
        )
        self.stdout.write(self.style.SUCCESS(f'  Totem: {totem.name}'))

        # 3. Criar Categorias
        self.stdout.write('Criando categorias...')
        categories_data = [
            ('turismo', 'Turismo'),
            ('cultura', 'Cultura'),
            ('servicos', 'Servicos'),
            ('transporte', 'Transporte'),
            ('saude', 'Saude'),
        ]
        for slug, name in categories_data:
            Category.objects.get_or_create(city=city, slug=slug, defaults={'name': name})
        self.stdout.write(self.style.SUCCESS('  Categorias criadas'))

        # 4. Criar Imagens da Galeria (backgrounds)
        self.stdout.write('Criando imagens da galeria...')
        gallery_images = [
            ('https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920', 'Vista do Rio de Janeiro', 'rio_vista.jpg'),
            ('https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=1920', 'Praia de Copacabana', 'copacabana.jpg'),
            ('https://images.unsplash.com/photo-1544989164-31dc3c645987?w=1920', 'Cristo Redentor', 'cristo.jpg'),
        ]
        
        for url, title, filename in gallery_images:
            if not GalleryImage.objects.filter(city=city, title=title).exists():
                image_content = self.download_image(url, filename)
                if image_content:
                    gallery = GalleryImage.objects.create(
                        city=city,
                        title=title,
                        is_active=True,
                    )
                    gallery.image.save(filename, image_content, save=True)
                    self.stdout.write(f'    {title}')

        # 5. Criar Noticias
        self.stdout.write('Criando noticias...')
        news_data = [
            {
                'title': 'Nova ciclovia sera inaugurada no proximo mes',
                'subtitle': 'Obra vai conectar praias da regiao oceanica',
                'content': 'A prefeitura anunciou a inauguracao da nova ciclovia.',
                'is_featured': True,
            },
            {
                'title': 'Festival de Jazz comeca neste fim de semana',
                'subtitle': 'Evento gratuito no Campo de Sao Bento',
                'content': 'O tradicional Festival de Jazz retorna com shows gratuitos.',
                'is_featured': True,
            },
            {
                'title': 'Museu de Arte Contemporanea reabre apos reforma',
                'subtitle': 'MAC volta com exposicao inedita',
                'content': 'Apos 6 meses de reforma, o MAC reabre suas portas.',
                'is_featured': True,
            },
        ]
        
        for idx, data in enumerate(news_data):
            news, created = News.objects.get_or_create(
                city=city,
                title=data['title'],
                defaults={
                    'subtitle': data['subtitle'],
                    'content': data['content'],
                    'is_featured': data['is_featured'],
                    'publish_at': timezone.now() - timedelta(days=idx),
                }
            )
            if created:
                self.stdout.write(f'    {news.title[:40]}')

        # 6. Criar Eventos
        self.stdout.write('Criando eventos...')
        base_lat = float(city.latitude)
        base_lng = float(city.longitude)
        
        events_data = [
            {
                'title': 'Festival de Jazz',
                'description': 'O maior festival de jazz da regiao.',
                'venue': 'Campo de Sao Bento',
                'start_date': timezone.now() + timedelta(days=3),
                'end_date': timezone.now() + timedelta(days=5),
                'price': 'Gratuito',
                'is_featured': True,
            },
            {
                'title': 'Feira de Artesanato',
                'description': 'Feira com produtos artesanais.',
                'venue': 'Praca Arariboia',
                'start_date': timezone.now() + timedelta(days=1),
                'end_date': timezone.now() + timedelta(days=1),
                'price': 'Entrada livre',
                'is_featured': False,
            },
            {
                'title': 'Corrida pela Cidade',
                'description': 'Corrida de rua com percursos de 5km e 10km.',
                'venue': 'Orla de Icarai',
                'start_date': timezone.now() + timedelta(days=7),
                'end_date': timezone.now() + timedelta(days=7),
                'price': 'R$ 50,00',
                'is_featured': True,
            },
            {
                'title': 'Show de MPB',
                'description': 'Show especial de musica popular brasileira.',
                'venue': 'Teatro Municipal',
                'start_date': timezone.now() + timedelta(days=10),
                'end_date': timezone.now() + timedelta(days=10),
                'price': 'R$ 80,00',
                'is_featured': True,
            },
        ]
        
        for data in events_data:
            event, created = Event.objects.get_or_create(
                city=city,
                title=data['title'],
                defaults={
                    'description': data['description'],
                    'venue': data['venue'],
                    'start_date': data['start_date'],
                    'end_date': data['end_date'],
                    'price': data['price'],
                    'is_featured': data['is_featured'],
                    'latitude': Decimal(str(base_lat + 0.01)),
                    'longitude': Decimal(str(base_lng + 0.01)),
                }
            )
            if created:
                self.stdout.write(f'    {event.title}')

        # 7. Criar POIs
        self.stdout.write('Criando pontos de interesse...')
        pois_data = [
            ('Hospital Estadual Azevedo Lima', 'hospital', 'Rua Dr. Mario Viana, 465', '(21) 2719-1234'),
            ('UPA Centro', 'hospital', 'Rua Visconde de Sepetiba, 100', '(21) 2620-5678'),
            ('Terminal Rodoviario', 'transport', 'Av. Visconde do Rio Branco', '(21) 2620-9876'),
            ('Estacao das Barcas', 'transport', 'Praca Arariboia', '(21) 2620-4567'),
            ('Restaurante Olimpo', 'restaurant', 'Rua Coronel Moreira Cesar, 200', '(21) 2710-1234'),
            ('Museu de Arte Contemporanea', 'attraction', 'Mirante da Boa Viagem', '(21) 2620-2400'),
            ('Fortaleza de Santa Cruz', 'attraction', 'Estrada General Eurico Gaspar Dutra', '(21) 2710-7840'),
            ('Praia de Icarai', 'attraction', 'Orla de Icarai', ''),
            ('Campo de Sao Bento', 'park', 'Alameda Edmundo de Macedo Soares', ''),
        ]
        
        for name, poi_type, address, phone in pois_data:
            poi, created = PointOfInterest.objects.get_or_create(
                city=city,
                name=name,
                defaults={
                    'poi_type': poi_type,
                    'address': address,
                    'phone': phone,
                    'latitude': Decimal(str(base_lat + 0.005)),
                    'longitude': Decimal(str(base_lng + 0.005)),
                }
            )
            if created:
                self.stdout.write(f'    {name}')

        # 8. Criar Playlist
        self.stdout.write('Criando playlist...')
        playlist, created = Playlist.objects.get_or_create(
            city=city,
            name='Programacao Padrao',
            defaults={
                'description': 'Programacao padrao para todos os totens',
                'is_default': True,
                'is_active': True,
                'all_totems': True,
                'weekdays': [0, 1, 2, 3, 4, 5, 6],
            }
        )
        
        if created:
            playlist_items = [
                {'item_type': 'clock', 'name': 'Relogio', 'duration': 8},
                {'item_type': 'weather', 'name': 'Previsao do Tempo', 'duration': 10},
                {'item_type': 'news', 'name': 'Noticias', 'duration': 12},
                {'item_type': 'events', 'name': 'Eventos', 'duration': 12},
            ]
            
            for idx, item_data in enumerate(playlist_items):
                PlaylistItem.objects.create(
                    playlist=playlist,
                    order=idx,
                    **item_data
                )
            self.stdout.write(self.style.SUCCESS(f'  Playlist: {playlist.name}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('Dados de demonstracao criados com sucesso!'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write('')
        self.stdout.write('Acesse:')
        self.stdout.write('   Player: http://10.50.30.168:3000/')
        self.stdout.write('   Menu TOMI: http://10.50.30.168:3000/?theme=tomi')
        self.stdout.write('   Admin: http://10.50.30.168:8000/admin/')
