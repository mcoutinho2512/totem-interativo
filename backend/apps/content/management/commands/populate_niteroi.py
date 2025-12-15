"""
Management command to populate Niterói data with real POIs, Events, and News
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.gis.geos import Point
from datetime import timedelta
from decimal import Decimal

from apps.tenants.models import City
from apps.content.models import Category, Event, News, PointOfInterest, GalleryImage


class Command(BaseCommand):
    help = 'Populate database with real Niterói data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting Niterói data population...'))

        # Get or create Niterói city
        city, created = City.objects.get_or_create(
            slug='niteroi',
            defaults={
                'name': 'Niterói',
                'state': 'RJ',
                'country': 'Brasil',
                'latitude': Decimal('-22.8833'),
                'longitude': Decimal('-43.1033'),
                'timezone': 'America/Sao_Paulo',
                'primary_color': '#1a365d',
                'secondary_color': '#2c5282',
                'default_language': 'pt-BR',
                'available_languages': ['pt-BR', 'en', 'es'],
                'is_active': True,
            }
        )

        if created:
            city.location = Point(-43.1033, -22.8833)
            city.save()
            self.stdout.write(self.style.SUCCESS(f'Created city: {city.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'City already exists: {city.name}'))

        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data for Niterói...'))
            Category.objects.filter(city=city).delete()
            Event.objects.filter(city=city).delete()
            News.objects.filter(city=city).delete()
            PointOfInterest.objects.filter(city=city).delete()

        # Create categories
        self.create_categories(city)

        # Create POIs
        self.create_pois(city)

        # Create Events
        self.create_events(city)

        # Create News
        self.create_news(city)

        self.stdout.write(self.style.SUCCESS('Niterói data population completed!'))

    def create_categories(self, city):
        """Create content categories"""
        categories_data = [
            {'name': 'Cultura', 'slug': 'cultura', 'icon': 'theater', 'color': '#9b59b6'},
            {'name': 'Esportes', 'slug': 'esportes', 'icon': 'sports', 'color': '#27ae60'},
            {'name': 'Música', 'slug': 'musica', 'icon': 'music', 'color': '#e74c3c'},
            {'name': 'Gastronomia', 'slug': 'gastronomia', 'icon': 'restaurant', 'color': '#f39c12'},
            {'name': 'Turismo', 'slug': 'turismo', 'icon': 'camera', 'color': '#3498db'},
            {'name': 'Saúde', 'slug': 'saude', 'icon': 'hospital', 'color': '#e74c3c'},
            {'name': 'Transporte', 'slug': 'transporte', 'icon': 'bus', 'color': '#1abc9c'},
            {'name': 'Festas', 'slug': 'festas', 'icon': 'party', 'color': '#e91e63'},
            {'name': 'Educação', 'slug': 'educacao', 'icon': 'school', 'color': '#2196f3'},
            {'name': 'Negócios', 'slug': 'negocios', 'icon': 'business', 'color': '#607d8b'},
        ]

        for i, data in enumerate(categories_data):
            cat, created = Category.objects.get_or_create(
                city=city,
                slug=data['slug'],
                defaults={
                    'name': data['name'],
                    'icon': data['icon'],
                    'color': data['color'],
                    'order': i,
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'  Created category: {cat.name}')

    def create_pois(self, city):
        """Create Points of Interest with real Niterói data"""

        # Get categories
        saude = Category.objects.filter(city=city, slug='saude').first()
        gastronomia = Category.objects.filter(city=city, slug='gastronomia').first()
        turismo = Category.objects.filter(city=city, slug='turismo').first()
        transporte = Category.objects.filter(city=city, slug='transporte').first()

        pois_data = [
            # HOSPITAIS
            {
                'name': 'Hospital Estadual Azevedo Lima',
                'poi_type': 'hospital',
                'category': saude,
                'description': 'Hospital público estadual de referência em urgência e emergência na região. Possui pronto-socorro 24 horas.',
                'address': 'Rua Coronel Tamarindo, 226 - Fonseca',
                'neighborhood': 'Fonseca',
                'latitude': Decimal('-22.8847'),
                'longitude': Decimal('-43.1014'),
                'phone': '(21) 2625-7070',
                'is_featured': True,
            },
            {
                'name': 'Hospital Universitário Antônio Pedro (HUAP)',
                'poi_type': 'hospital',
                'category': saude,
                'description': 'Hospital universitário vinculado à UFF, referência em diversas especialidades médicas e ensino.',
                'address': 'Av. Marquês do Paraná, 303 - Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8972'),
                'longitude': Decimal('-43.1233'),
                'phone': '(21) 2629-9000',
                'website': 'https://www.huap.uff.br',
                'is_featured': True,
            },
            {
                'name': 'Hospital Icaraí',
                'poi_type': 'hospital',
                'category': saude,
                'description': 'Hospital privado com diversas especialidades, centro cirúrgico e UTI.',
                'address': 'Rua Marquês de Paraná, 233 - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.9039'),
                'longitude': Decimal('-43.1122'),
                'phone': '(21) 3602-3000',
                'website': 'https://www.hospitalicarai.com.br',
            },
            {
                'name': 'UPA Fonseca',
                'poi_type': 'hospital',
                'category': saude,
                'description': 'Unidade de Pronto Atendimento 24 horas para casos de urgência e emergência de baixa e média complexidade.',
                'address': 'Rua Desembargador Lima Castro, 238 - Fonseca',
                'neighborhood': 'Fonseca',
                'latitude': Decimal('-22.8819'),
                'longitude': Decimal('-43.1056'),
                'phone': '(21) 2625-0500',
            },

            # RESTAURANTES
            {
                'name': 'Olympe Niterói',
                'poi_type': 'restaurant',
                'category': gastronomia,
                'description': 'Restaurante de alta gastronomia com culinária brasileira contemporânea. Chef renomado e ambiente sofisticado.',
                'address': 'Rua Gavião Peixoto, 37 - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.9052'),
                'longitude': Decimal('-43.1089'),
                'phone': '(21) 2610-2121',
                'opening_hours': {'seg-sab': '12:00-23:00', 'dom': '12:00-17:00'},
                'is_featured': True,
            },
            {
                'name': 'Antiquarius Niterói',
                'poi_type': 'restaurant',
                'category': gastronomia,
                'description': 'Restaurante de culinária portuguesa e frutos do mar. Ambiente clássico com vista para a baía.',
                'address': 'Av. Quintino Bocaiúva, 17 - São Francisco',
                'neighborhood': 'São Francisco',
                'latitude': Decimal('-22.9372'),
                'longitude': Decimal('-43.0917'),
                'phone': '(21) 2610-1200',
                'opening_hours': {'seg-dom': '12:00-00:00'},
            },
            {
                'name': 'La Villa Restaurante',
                'poi_type': 'restaurant',
                'category': gastronomia,
                'description': 'Restaurante italiano com massas artesanais e pizzas no forno a lenha.',
                'address': 'Rua Paulo Gustavo, 56 - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.9028'),
                'longitude': Decimal('-43.1095'),
                'phone': '(21) 2610-5500',
                'opening_hours': {'ter-dom': '18:00-00:00'},
            },
            {
                'name': 'Porcão Niterói',
                'poi_type': 'restaurant',
                'category': gastronomia,
                'description': 'Churrascaria rodízio com carnes nobres e buffet completo.',
                'address': 'Av. Almirante Benjamin Sodré, 200 - São Francisco',
                'neighborhood': 'São Francisco',
                'latitude': Decimal('-22.9389'),
                'longitude': Decimal('-43.0894'),
                'phone': '(21) 2622-3444',
                'website': 'https://www.porcao.com.br',
                'opening_hours': {'seg-dom': '12:00-23:00'},
            },
            {
                'name': 'Outback Icaraí',
                'poi_type': 'restaurant',
                'category': gastronomia,
                'description': 'Steakhouse australiano com ambiente descontraído e pratos generosos.',
                'address': 'Rua Moreira César, 229 - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.9001'),
                'longitude': Decimal('-43.1108'),
                'phone': '(21) 2715-9800',
                'website': 'https://www.outback.com.br',
                'opening_hours': {'seg-dom': '12:00-23:00'},
            },

            # HOTÉIS
            {
                'name': 'H Niterói Hotel',
                'poi_type': 'hotel',
                'category': turismo,
                'description': 'Hotel boutique com vista para a Baía de Guanabara. Quartos modernos e piscina na cobertura.',
                'address': 'Av. Almirante Benjamin Sodré, 300 - Charitas',
                'neighborhood': 'Charitas',
                'latitude': Decimal('-22.9356'),
                'longitude': Decimal('-43.0683'),
                'phone': '(21) 3602-9000',
                'website': 'https://www.hniteroi.com.br',
                'is_featured': True,
            },
            {
                'name': 'Icaraí Praia Hotel',
                'poi_type': 'hotel',
                'category': turismo,
                'description': 'Hotel à beira-mar com quartos com vista para a praia de Icaraí.',
                'address': 'Av. Prefeito Silvio Picanço, 12 - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.9089'),
                'longitude': Decimal('-43.1056'),
                'phone': '(21) 2612-6500',
            },
            {
                'name': 'Tower Hotel',
                'poi_type': 'hotel',
                'category': turismo,
                'description': 'Hotel executivo no centro de Niterói, próximo às barcas.',
                'address': 'Rua Visconde do Rio Branco, 142 - Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8950'),
                'longitude': Decimal('-43.1278'),
                'phone': '(21) 2719-5500',
            },
            {
                'name': 'Quality Suites Niterói',
                'poi_type': 'hotel',
                'category': turismo,
                'description': 'Hotel com suítes espaçosas, piscina e academia. Ideal para estadias prolongadas.',
                'address': 'Rua Miguel de Frias, 41 - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.9006'),
                'longitude': Decimal('-43.1089'),
                'phone': '(21) 2612-2900',
                'website': 'https://www.atlanticahotels.com.br',
            },

            # ATRAÇÕES TURÍSTICAS
            {
                'name': 'MAC - Museu de Arte Contemporânea',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Projeto icônico de Oscar Niemeyer em formato de disco voador. Abriga acervo de arte contemporânea e oferece vista panorâmica da Baía de Guanabara.',
                'address': 'Mirante da Boa Viagem, s/n - Boa Viagem',
                'neighborhood': 'Boa Viagem',
                'latitude': Decimal('-22.9061'),
                'longitude': Decimal('-43.1264'),
                'phone': '(21) 2620-2400',
                'website': 'https://www.culturaniteroi.com.br/mac',
                'opening_hours': {'ter-dom': '10:00-18:00'},
                'is_featured': True,
            },
            {
                'name': 'Fortaleza de Santa Cruz da Barra',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Fortaleza histórica do século XVI na entrada da Baía de Guanabara. Visitas guiadas pelo Exército Brasileiro.',
                'address': 'Estrada General Eurico Gaspar Dutra, s/n - Jurujuba',
                'neighborhood': 'Jurujuba',
                'latitude': Decimal('-22.9333'),
                'longitude': Decimal('-43.1361'),
                'phone': '(21) 2710-7840',
                'opening_hours': {'ter-dom': '09:00-17:00'},
                'is_featured': True,
            },
            {
                'name': 'Parque da Cidade',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Parque natural com trilhas, mirante com vista panorâmica de Niterói e Rio de Janeiro, área de piquenique.',
                'address': 'Estrada Fróes, s/n - São Francisco',
                'neighborhood': 'São Francisco',
                'latitude': Decimal('-22.9194'),
                'longitude': Decimal('-43.0917'),
                'phone': '(21) 2710-2475',
                'opening_hours': {'ter-dom': '07:00-18:00'},
                'is_featured': True,
            },
            {
                'name': 'Praia de Icaraí',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Principal praia urbana de Niterói com calçadão, quiosques e vista para o Rio de Janeiro.',
                'address': 'Av. Prefeito Silvio Picanço - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.9078'),
                'longitude': Decimal('-43.1044'),
                'is_featured': True,
            },
            {
                'name': 'Praia de Itacoatiara',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Praia oceânica cercada por montanhas, popular entre surfistas. Trilha para o Costão com vista espetacular.',
                'address': 'Av. Litorânea - Itacoatiara',
                'neighborhood': 'Itacoatiara',
                'latitude': Decimal('-22.9756'),
                'longitude': Decimal('-43.0289'),
                'is_featured': True,
            },
            {
                'name': 'Pedra do Índio',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Formação rochosa natural que lembra um rosto indígena. Ponto de pesca e contemplação.',
                'address': 'Av. Carlos Ermelindo Marins - Charitas',
                'neighborhood': 'Charitas',
                'latitude': Decimal('-22.9317'),
                'longitude': Decimal('-43.0583'),
            },
            {
                'name': 'Campo de São Bento',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Parque histórico com área verde, playgrounds, lagos com pedalinhos e feira de artesanato aos domingos.',
                'address': 'Alameda São Boaventura - Icaraí',
                'neighborhood': 'Icaraí',
                'latitude': Decimal('-22.8944'),
                'longitude': Decimal('-43.1067'),
                'opening_hours': {'seg-dom': '06:00-18:00'},
            },
            {
                'name': 'Caminho Niemeyer',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Complexo arquitetônico de Oscar Niemeyer incluindo teatro, memorial, praça e outros edifícios culturais.',
                'address': 'Rua Jornalista Rogério Coelho Neto, s/n - Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8914'),
                'longitude': Decimal('-43.1258'),
                'website': 'https://www.culturaniteroi.com.br',
                'is_featured': True,
            },
            {
                'name': 'Teatro Popular Oscar Niemeyer',
                'poi_type': 'attraction',
                'category': turismo,
                'description': 'Teatro moderno projetado por Oscar Niemeyer com programação de shows, peças e espetáculos.',
                'address': 'Rua Jornalista Rogério Coelho Neto, s/n - Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8917'),
                'longitude': Decimal('-43.1264'),
                'phone': '(21) 2719-0700',
                'website': 'https://www.culturaniteroi.com.br',
            },
            {
                'name': 'Mercado São Pedro',
                'poi_type': 'attraction',
                'category': gastronomia,
                'description': 'Tradicional mercado de peixes com restaurantes especializados em frutos do mar frescos.',
                'address': 'Praça Arariboia - Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8933'),
                'longitude': Decimal('-43.1261'),
                'opening_hours': {'seg-dom': '09:00-21:00'},
                'is_featured': True,
            },

            # TRANSPORTE
            {
                'name': 'Estação das Barcas Arariboia',
                'poi_type': 'transport',
                'category': transporte,
                'description': 'Terminal de barcas conectando Niterói ao Rio de Janeiro. Travessia de 20 minutos até a Praça XV.',
                'address': 'Praça Arariboia, s/n - Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8931'),
                'longitude': Decimal('-43.1247'),
                'website': 'https://www.bfrj.com.br',
                'is_featured': True,
            },
            {
                'name': 'Terminal Rodoviário João Goulart',
                'poi_type': 'transport',
                'category': transporte,
                'description': 'Principal rodoviária de Niterói com linhas para todo o Brasil e terminal de ônibus municipais.',
                'address': 'Av. Visconde do Rio Branco, 628 - Centro',
                'neighborhood': 'Centro',
                'latitude': Decimal('-22.8944'),
                'longitude': Decimal('-43.1211'),
                'phone': '(21) 2622-0262',
            },
            {
                'name': 'Terminal de Charitas (Catamarã)',
                'poi_type': 'transport',
                'category': transporte,
                'description': 'Terminal de catamarãs com travessia rápida para o Rio de Janeiro (Praça XV). Viagem de 12 minutos.',
                'address': 'Av. Carlos Ermelindo Marins, s/n - Charitas',
                'neighborhood': 'Charitas',
                'latitude': Decimal('-22.9356'),
                'longitude': Decimal('-43.0639'),
                'website': 'https://www.bfrj.com.br',
            },
        ]

        created_count = 0
        for poi_data in pois_data:
            lat = poi_data.pop('latitude')
            lng = poi_data.pop('longitude')

            poi, created = PointOfInterest.objects.get_or_create(
                city=city,
                name=poi_data['name'],
                defaults={
                    **poi_data,
                    'latitude': lat,
                    'longitude': lng,
                    'location': Point(float(lng), float(lat)),
                    'is_active': True,
                }
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  Created {created_count} POIs'))

    def create_events(self, city):
        """Create Events with real Niterói data"""

        # Get categories
        cultura = Category.objects.filter(city=city, slug='cultura').first()
        musica = Category.objects.filter(city=city, slug='musica').first()
        esportes = Category.objects.filter(city=city, slug='esportes').first()
        festas = Category.objects.filter(city=city, slug='festas').first()
        gastronomia = Category.objects.filter(city=city, slug='gastronomia').first()

        now = timezone.now()

        events_data = [
            {
                'title': 'Réveillon 2026 em Icaraí',
                'category': festas,
                'description': 'Grande festa de Réveillon na praia de Icaraí com shows musicais, queima de fogos e atrações para toda a família. Venha celebrar a virada do ano com vista para a Baía de Guanabara!',
                'venue': 'Praia de Icaraí',
                'address': 'Av. Prefeito Silvio Picanço, Icaraí',
                'latitude': Decimal('-22.9078'),
                'longitude': Decimal('-43.1044'),
                'start_date': now.replace(month=12, day=31, hour=20, minute=0),
                'end_date': now.replace(month=12, day=31, hour=23, minute=59) + timedelta(hours=4),
                'price': 'Gratuito',
                'is_featured': True,
            },
            {
                'title': 'Feira de Artesanato do Campo de São Bento',
                'category': cultura,
                'description': 'Tradicional feira de artesanato com produtos locais, arte, gastronomia e apresentações culturais. Acontece todos os domingos no histórico Campo de São Bento.',
                'venue': 'Campo de São Bento',
                'address': 'Alameda São Boaventura, Icaraí',
                'latitude': Decimal('-22.8944'),
                'longitude': Decimal('-43.1067'),
                'start_date': now + timedelta(days=(6 - now.weekday()) % 7 + 1),  # Próximo domingo
                'end_date': None,
                'price': 'Entrada Gratuita',
                'is_featured': True,
            },
            {
                'title': 'Festival de Jazz de Niterói',
                'category': musica,
                'description': 'Festival internacional de jazz com artistas nacionais e internacionais. Shows em diversos pontos da cidade, incluindo o Teatro Popular e MAC.',
                'venue': 'Teatro Popular Oscar Niemeyer',
                'address': 'Rua Jornalista Rogério Coelho Neto, s/n - Centro',
                'latitude': Decimal('-22.8917'),
                'longitude': Decimal('-43.1264'),
                'start_date': now + timedelta(days=30),
                'end_date': now + timedelta(days=33),
                'price': 'A partir de R$ 50,00',
                'url': 'https://www.culturaniteroi.com.br',
                'is_featured': True,
            },
            {
                'title': 'Festa de São Pedro dos Pescadores',
                'category': festas,
                'description': 'Tradicional festa religiosa e cultural em homenagem a São Pedro, padroeiro dos pescadores. Procissão marítima, comidas típicas e shows.',
                'venue': 'Praia de Jurujuba',
                'address': 'Estrada Leopoldo Fróes - Jurujuba',
                'latitude': Decimal('-22.9322'),
                'longitude': Decimal('-43.1317'),
                'start_date': now.replace(month=6, day=29, hour=8, minute=0),
                'end_date': now.replace(month=6, day=29, hour=23, minute=0),
                'price': 'Gratuito',
            },
            {
                'title': 'Carnaval de Niterói 2026',
                'category': festas,
                'description': 'Desfiles de escolas de samba, blocos de rua e matinês para crianças. Programação completa em diversos bairros da cidade.',
                'venue': 'Diversos locais',
                'address': 'Centro e orla de Niterói',
                'latitude': Decimal('-22.8944'),
                'longitude': Decimal('-43.1067'),
                'start_date': now.replace(month=2, day=14, hour=15, minute=0),
                'end_date': now.replace(month=2, day=18, hour=0, minute=0),
                'price': 'Gratuito',
                'is_featured': True,
            },
            {
                'title': 'Festival Niterói em Cena',
                'category': cultura,
                'description': 'Festival de teatro com peças nacionais e internacionais. Espetáculos para adultos e crianças em diversos espaços culturais.',
                'venue': 'Teatro Popular Oscar Niemeyer',
                'address': 'Rua Jornalista Rogério Coelho Neto, s/n - Centro',
                'latitude': Decimal('-22.8917'),
                'longitude': Decimal('-43.1264'),
                'start_date': now + timedelta(days=60),
                'end_date': now + timedelta(days=67),
                'price': 'A partir de R$ 30,00',
            },
            {
                'title': 'Regata de Vela Baía de Guanabara',
                'category': esportes,
                'description': 'Competição de vela com participantes de todo o Brasil. Largada em frente ao Iate Clube de Charitas.',
                'venue': 'Iate Clube de Charitas',
                'address': 'Av. Carlos Ermelindo Marins - Charitas',
                'latitude': Decimal('-22.9350'),
                'longitude': Decimal('-43.0639'),
                'start_date': now + timedelta(days=45),
                'end_date': now + timedelta(days=47),
                'price': 'Gratuito para espectadores',
            },
            {
                'title': 'Feira Orgânica de Icaraí',
                'category': gastronomia,
                'description': 'Feira semanal com produtos orgânicos, artesanais e naturais. Frutas, verduras, queijos, pães e muito mais direto do produtor.',
                'venue': 'Praça Getúlio Vargas',
                'address': 'Praça Getúlio Vargas, Icaraí',
                'latitude': Decimal('-22.9017'),
                'longitude': Decimal('-43.1078'),
                'start_date': now + timedelta(days=(5 - now.weekday()) % 7 + 1),  # Próximo sábado
                'end_date': None,
                'price': 'Entrada Gratuita',
                'is_all_day': False,
            },
            {
                'title': 'Shows no Teatro Popular Oscar Niemeyer - Temporada 2026',
                'category': musica,
                'description': 'Programação especial com grandes nomes da música brasileira. Shows de MPB, samba, rock e música instrumental.',
                'venue': 'Teatro Popular Oscar Niemeyer',
                'address': 'Rua Jornalista Rogério Coelho Neto, s/n - Centro',
                'latitude': Decimal('-22.8917'),
                'longitude': Decimal('-43.1264'),
                'start_date': now + timedelta(days=15),
                'end_date': now + timedelta(days=90),
                'price': 'Variável conforme show',
                'url': 'https://www.culturaniteroi.com.br',
            },
            {
                'title': 'Festa Junina no Horto do Fonseca',
                'category': festas,
                'description': 'Tradicional festa junina com quadrilhas, comidas típicas, fogueira e forró. Diversão para toda a família.',
                'venue': 'Horto do Fonseca',
                'address': 'Alameda São Boaventura, 770 - Fonseca',
                'latitude': Decimal('-22.8772'),
                'longitude': Decimal('-43.1033'),
                'start_date': now.replace(month=6, day=20, hour=17, minute=0),
                'end_date': now.replace(month=6, day=20, hour=23, minute=0),
                'price': 'Entrada Gratuita',
            },
            {
                'title': 'Circuito de Corrida de Rua - Etapa Niterói',
                'category': esportes,
                'description': 'Corrida de rua com percursos de 5km e 10km pela orla de Niterói. Premiação para os vencedores de cada categoria.',
                'venue': 'Praia de Icaraí',
                'address': 'Av. Prefeito Silvio Picanço - Icaraí',
                'latitude': Decimal('-22.9078'),
                'longitude': Decimal('-43.1044'),
                'start_date': now + timedelta(days=20),
                'end_date': now + timedelta(days=20) + timedelta(hours=5),
                'price': 'R$ 80,00 (inscrição)',
            },
            {
                'title': 'Exposição: Arte Contemporânea Brasileira',
                'category': cultura,
                'description': 'Nova exposição no MAC com obras de artistas contemporâneos brasileiros. Curadoria especial celebrando 30 anos do museu.',
                'venue': 'MAC - Museu de Arte Contemporânea',
                'address': 'Mirante da Boa Viagem, s/n - Boa Viagem',
                'latitude': Decimal('-22.9061'),
                'longitude': Decimal('-43.1264'),
                'start_date': now + timedelta(days=7),
                'end_date': now + timedelta(days=120),
                'price': 'R$ 16,00 (inteira) / R$ 8,00 (meia)',
                'url': 'https://www.culturaniteroi.com.br/mac',
                'is_featured': True,
            },
        ]

        created_count = 0
        for event_data in events_data:
            event, created = Event.objects.get_or_create(
                city=city,
                title=event_data['title'],
                defaults={
                    **event_data,
                    'is_published': True,
                }
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  Created {created_count} Events'))

    def create_news(self, city):
        """Create News with Niterói content"""

        turismo = Category.objects.filter(city=city, slug='turismo').first()
        cultura = Category.objects.filter(city=city, slug='cultura').first()
        transporte = Category.objects.filter(city=city, slug='transporte').first()
        musica = Category.objects.filter(city=city, slug='musica').first()
        gastronomia = Category.objects.filter(city=city, slug='gastronomia').first()

        now = timezone.now()

        news_data = [
            {
                'title': 'Nova ciclovia conecta praias da região oceânica de Niterói',
                'category': transporte,
                'subtitle': 'Obra faz parte do projeto de mobilidade sustentável da prefeitura',
                'content': '''A Prefeitura de Niterói inaugurou nesta semana a nova ciclovia que conecta as praias de Piratininga, Camboinhas e Itacoatiara, totalizando 8km de extensão.

A obra, que faz parte do projeto "Niterói Sustentável", custou R$ 12 milhões e foi concluída em 18 meses. A ciclovia conta com iluminação de LED, pontos de descanso com bebedouros e bicicletários em cada praia.

"Esta ciclovia vai beneficiar moradores e turistas, incentivando o uso de transporte sustentável e melhorando a qualidade de vida", afirmou o secretário de Urbanismo.

A nova via cicloviária se conecta com a malha existente em Piratininga, permitindo que ciclistas possam ir do Centro até Itacoatiara pedalando por trajetos seguros.

Horário de funcionamento: 24 horas, com iluminação das 18h às 6h.''',
                'publish_at': now - timedelta(days=2),
                'is_featured': True,
            },
            {
                'title': 'MAC recebe exposição inédita de artistas latino-americanos',
                'category': cultura,
                'subtitle': 'Mostra reúne 150 obras de 40 artistas de 12 países',
                'content': '''O Museu de Arte Contemporânea de Niterói (MAC) inaugura no próximo mês a exposição "Vozes da América Latina", reunindo obras de 40 artistas contemporâneos de 12 países latino-americanos.

A mostra, inédita no Brasil, traz pinturas, esculturas, instalações e obras de arte digital que exploram temas como identidade, migração e meio ambiente.

Entre os artistas participantes estão nomes consagrados como o mexicano Gabriel Orozco, a colombiana Doris Salcedo e o argentino Tomás Saraceno, além de artistas emergentes selecionados em curadoria especial.

"O MAC tem vocação para ser um espaço de diálogo entre as artes do continente. Esta exposição consolida esse papel", disse o diretor do museu.

A exposição ficará em cartaz de março a julho, com entrada gratuita às quartas-feiras.

Visitas guiadas serão oferecidas aos sábados e domingos às 11h e 15h.''',
                'publish_at': now - timedelta(days=1),
                'is_featured': True,
            },
            {
                'title': 'Prefeitura anuncia revitalização do Centro Histórico',
                'category': turismo,
                'subtitle': 'Projeto prevê restauração de prédios históricos e novo calçadão',
                'content': '''A Prefeitura de Niterói anunciou um amplo projeto de revitalização do Centro Histórico da cidade, com investimento previsto de R$ 50 milhões nos próximos três anos.

O projeto inclui:
- Restauração de 15 prédios históricos
- Novo calçadão na Rua da Conceição
- Iluminação cenográfica nos pontos turísticos
- Criação de um circuito cultural a pé
- Instalação de mobiliário urbano e jardins verticais

A primeira fase, que começa em abril, contempla a restauração do Solar do Jambeiro e do antigo Mercado Municipal.

"Queremos resgatar a história de Niterói e criar um polo de turismo e cultura no Centro", explicou o prefeito em coletiva de imprensa.

O projeto foi desenvolvido em parceria com o IPHAN e a Universidade Federal Fluminense.''',
                'publish_at': now - timedelta(hours=12),
                'is_featured': False,
            },
            {
                'title': 'Festival de Jazz de Niterói bate recorde de público',
                'category': musica,
                'subtitle': 'Edição 2025 reuniu mais de 50 mil pessoas em quatro dias de evento',
                'content': '''A 15ª edição do Festival de Jazz de Niterói encerrou com recorde de público: mais de 50 mil pessoas passaram pelos palcos montados no Caminho Niemeyer e no MAC ao longo dos quatro dias de evento.

O festival contou com 30 apresentações de artistas nacionais e internacionais, incluindo shows memoráveis de Hermeto Pascoal, Ivan Lins e do saxofonista americano Kenny Garrett.

"Superamos todas as expectativas. Niterói se consolida como capital do jazz no Brasil", comemorou o produtor do evento.

Além dos shows principais, o festival ofereceu workshops gratuitos, jam sessions e uma área gastronômica com food trucks e restaurantes parceiros.

A próxima edição já tem data confirmada: de 15 a 18 de outubro de 2026.

O evento é realizado com apoio da Secretaria de Cultura e patrocínio de empresas locais.''',
                'publish_at': now - timedelta(days=5),
                'is_featured': True,
            },
            {
                'title': 'Novo restaurante de chef premiado inaugura em Icaraí',
                'category': gastronomia,
                'subtitle': 'Casa traz conceito de cozinha brasileira contemporânea com ingredientes locais',
                'content': '''O bairro de Icaraí ganha um novo destino gastronômico: o restaurante "Raízes", do chef Felipe Santos, premiado com estrela Michelin por seu trabalho em São Paulo.

O espaço de 200m² na Rua Moreira César oferece menu degustação e carta à la carte com pratos que reinterpretam receitas tradicionais brasileiras usando ingredientes de pequenos produtores do Rio de Janeiro.

Entre os destaques do menu estão o "Moqueca do nosso litoral" com peixes da Região dos Lagos e o "Porco Niterói" com cortes especiais de produtor local.

"Escolhi Niterói pela qualidade de vida e pela proximidade com produtores incríveis", disse o chef em entrevista exclusiva.

O restaurante funciona de terça a sábado para jantar (19h às 23h) e aos domingos para almoço (12h às 16h). Reservas pelo telefone (21) 99999-9999 ou pelo site.

Menu degustação: R$ 280 por pessoa (harmonização R$ 180).''',
                'publish_at': now - timedelta(hours=6),
                'is_featured': False,
            },
            {
                'title': 'UFF abre inscrições para cursos gratuitos de extensão',
                'category': cultura,
                'subtitle': 'São mais de 2.000 vagas em 50 cursos nas áreas de tecnologia, idiomas e artes',
                'content': '''A Universidade Federal Fluminense (UFF) abriu inscrições para seus cursos de extensão gratuitos do primeiro semestre de 2026. São mais de 2.000 vagas distribuídas em 50 cursos nas áreas de tecnologia, idiomas, artes e gestão.

Entre os cursos oferecidos estão:
- Introdução à Programação Python
- Inglês e Espanhol básico e intermediário
- Fotografia Digital
- Marketing Digital
- Gestão de Projetos
- Teatro e Expressão Corporal

As inscrições podem ser feitas pelo site da UFF até o dia 30 deste mês. Os cursos têm duração de 3 a 6 meses e são realizados no campus do Gragoatá e no Centro.

"Os cursos de extensão são uma forma de devolver à sociedade o conhecimento produzido na universidade", afirmou o pró-reitor de Extensão.

Para se inscrever, é necessário ter ensino médio completo. Mais informações: extensao.uff.br''',
                'publish_at': now - timedelta(days=3),
                'is_featured': False,
            },
        ]

        created_count = 0
        for news_item in news_data:
            news, created = News.objects.get_or_create(
                city=city,
                title=news_item['title'],
                defaults={
                    **news_item,
                    'is_published': True,
                }
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  Created {created_count} News articles'))
