# 🏛️ Sanaris City Totem

Sistema de Totem Interativo Digital para cidades inteligentes. Uma solução completa para informações turísticas, navegação, eventos e serviços públicos.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Reference](#-api-reference)
- [Temas Disponíveis](#-temas-disponíveis)
- [Internacionalização](#-internacionalização)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Contribuição](#-contribuição)

## 🎯 Visão Geral

O **Sanaris City Totem** é uma plataforma de digital signage e quiosque interativo projetada para fornecer informações úteis aos cidadãos e turistas em espaços públicos. O sistema oferece:

- **Navegação GPS** com rotas a pé, carro e bicicleta
- **Previsão do Tempo** em tempo real
- **Eventos da Cidade** com localização e direções
- **Pontos de Interesse (POIs)** como hospitais, restaurantes, hotéis
- **Notícias Locais** atualizadas
- **Digital Signage** para exibição de conteúdo publicitário

## ✨ Funcionalidades

### 🗺️ Navegação
- Busca de endereços com geocoding
- Cálculo de rotas (a pé, carro, bicicleta)
- Exibição de rota no mapa interativo
- QR Code para continuar navegação no celular
- Integração com OpenRouteService

### 🌤️ Clima
- Temperatura atual e sensação térmica
- Previsão para os próximos dias
- Umidade, vento e condições climáticas
- Ícones dinâmicos por condição

### 📅 Eventos
- Lista de eventos da cidade
- Filtro por categoria e data
- Botão "Rota até lá" integrado com navegação
- Informações de preço e local

### 📍 Pontos de Interesse
- Categorias: hospitais, restaurantes, hotéis, transporte, atrações
- Filtros por tipo
- Telefone para contato
- Botão de navegação até o local

### �� Notícias
- Feed de notícias locais
- Imagens e resumos
- Atualização via RSS ou API

### 🎬 Digital Signage (Player)
- Rotação automática de conteúdo
- Suporte a imagens e vídeos
- Playlists configuráveis
- Modo fullscreen

## 🏗️ Arquitetura
```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND TOTEM                         │
│                   (React + TypeScript)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  TOMI   │ │  Touch  │ │Dashboard│ │ Player  │          │
│  │  Theme  │ │  Theme  │ │  Theme  │ │  Theme  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API
┌─────────────────────────▼───────────────────────────────────┐
│                      BACKEND API                            │
│                 (Django REST Framework)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Totems  │ │ Content │ │Navigation│ │ Weather │          │
│  │   App   │ │   App   │ │   App   │ │   App   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      DATA LAYER                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   PostgreSQL    │  │      Redis      │                  │
│  │   (PostGIS)     │  │    (Cache)      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tecnologias

### Backend
- **Python 3.11**
- **Django 4.x** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Banco de dados
- **PostGIS** - Extensão geoespacial
- **Redis** - Cache e filas
- **Celery** - Tarefas assíncronas
- **Gunicorn** - Servidor WSGI

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type safety
- **React Router v6** - Navegação SPA
- **React Leaflet** - Mapas interativos
- **i18next** - Internacionalização
- **Axios** - Cliente HTTP
- **Zustand** - State management

### Infraestrutura
- **Docker & Docker Compose** - Containerização
- **Nginx** - Proxy reverso (produção)

### APIs Externas
- **OpenRouteService** - Rotas e geocoding
- **OpenStreetMap** - Tiles do mapa
- **OpenWeatherMap** - Dados meteorológicos (opcional)

## 🚀 Instalação

### Pré-requisitos

- Docker 20.x+
- Docker Compose 2.x+
- Git

### Clone o repositório
```bash
git clone https://github.com/mcoutinho2512/totem-interativo.git
cd totem-interativo
```

### Configuração do ambiente
```bash
# Copie o arquivo de exemplo
cp backend/.env.example backend/.env

# Edite as variáveis de ambiente
nano backend/.env
```

### Inicie os containers
```bash
docker compose up -d --build
```

### Verifique se está rodando
```bash
docker compose ps
docker compose logs -f
```

## ⚙️ Configuração

### Variáveis de Ambiente (backend/.env)
```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,10.50.30.168

# Database
DB_NAME=sanaris_db
DB_USER=sanaris
DB_PASSWORD=sanaris_password
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# APIs Externas
OPENROUTESERVICE_API_KEY=your-api-key-here
OPENWEATHERMAP_API_KEY=your-api-key-here

# Configurações do Totem
DEFAULT_CITY_LAT=-22.8972
DEFAULT_CITY_LNG=-43.1072
DEFAULT_CITY_NAME=Niterói
SESSION_TIMEOUT=60
```

### Obter API Keys

#### OpenRouteService (Obrigatório para navegação)
1. Acesse https://openrouteservice.org/dev/#/signup
2. Crie uma conta gratuita
3. Gere um token em "Tokens"
4. Adicione no `.env` como `OPENROUTESERVICE_API_KEY`

#### OpenWeatherMap (Opcional)
1. Acesse https://openweathermap.org/api
2. Crie uma conta gratuita
3. Gere uma API key
4. Adicione no `.env` como `OPENWEATHERMAP_API_KEY`

## 📖 Uso

### Acessar o Frontend

| URL | Descrição |
|-----|-----------|
| http://localhost:3000 | Player (Digital Signage) |
| http://localhost:3000/?theme=tomi | Tema TOMI |
| http://localhost:3000/?theme=touch | Tema Touch |
| http://localhost:3000/?theme=dashboard | Tema Dashboard |

### Acessar o Backend

| URL | Descrição |
|-----|-----------|
| http://localhost:8000/admin | Django Admin |
| http://localhost:8000/api/v1/ | API REST |

### Criar superusuário
```bash
docker compose exec backend python manage.py createsuperuser
```

### Popular dados de demonstração
```bash
docker compose exec backend python manage.py populate_demo
```

## 📚 API Reference

### Totems
```
GET    /api/v1/totems/              # Lista todos os totems
POST   /api/v1/totems/              # Cria novo totem
GET    /api/v1/totems/{id}/         # Detalhes do totem
PUT    /api/v1/totems/{id}/         # Atualiza totem
DELETE /api/v1/totems/{id}/         # Remove totem
POST   /api/v1/totems/identify/     # Identifica totem por IP
```

### Navegação
```
GET    /api/v1/navigation/geocode/?q={query}  # Busca endereços
POST   /api/v1/navigation/route/              # Calcula rota
POST   /api/v1/navigation/routes/             # Rotas multi-modal
POST   /api/v1/navigation/qrcode/             # Gera QR Code
```

### Conteúdo
```
GET    /api/v1/content/events/      # Lista eventos
GET    /api/v1/content/news/        # Lista notícias
GET    /api/v1/content/pois/        # Lista POIs
GET    /api/v1/content/ads/         # Lista publicidade
```

### Clima
```
GET    /api/v1/weather/current/     # Clima atual
GET    /api/v1/weather/forecast/    # Previsão
```

## 🎨 Temas Disponíveis

### 1. Player (Digital Signage)
- Modo fullscreen para exibição de conteúdo
- Rotação automática de mídia
- Ideal para totens sem interação

### 2. TOMI
- Interface inspirada nos totens TOMI
- Menu circular com ícones grandes
- Seletor de idioma integrado
- Ideal para turismo

### 3. Touch
- Interface otimizada para toque
- Cards grandes e espaçados
- Navegação simplificada
- Ideal para quiosques

### 4. Dashboard
- Visão geral com widgets
- Clima, eventos e notícias na mesma tela
- Ideal para displays informativos

## 🌍 Internacionalização

O sistema suporta múltiplos idiomas:

| Código | Idioma |
|--------|--------|
| pt | Português (Brasil) |
| en | English |
| es | Español |

### Adicionar novo idioma

1. Crie o arquivo de tradução:
```bash
cp frontend-totem/src/i18n/locales/pt.json frontend-totem/src/i18n/locales/fr.json
```

2. Traduza as chaves no novo arquivo

3. Registre no `i18n/index.ts`:
```typescript
import fr from './locales/fr.json';

resources: {
  // ...
  fr: { translation: fr },
}
```

4. Adicione o botão no Header

## 📁 Estrutura do Projeto
```
sanaris-city-totem/
├── backend/
│   ├── apps/
│   │   ├── advertising/     # Publicidade
│   │   ├── analytics/       # Analytics e métricas
│   │   ├── content/         # Eventos, notícias, POIs
│   │   ├── core/            # Utilitários
│   │   ├── navigation/      # Rotas e geocoding
│   │   ├── tenants/         # Multi-tenancy (cidades)
│   │   ├── totems/          # Gestão de totems
│   │   └── weather/         # Clima
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
│
├── frontend-totem/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── i18n/
│   │   │   ├── locales/
│   │   │   │   ├── pt.json
│   │   │   │   ├── en.json
│   │   │   │   └── es.json
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── Events.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── HomeTomi.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── News.tsx
│   │   │   ├── Player.tsx
│   │   │   ├── POIs.tsx
│   │   │   └── Weather.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── totemStore.ts
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── Dockerfile
│   └── package.json
│
├── frontend-admin/          # Painel administrativo
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🧪 Testes
```bash
# Backend
docker compose exec backend python manage.py test

# Frontend
docker compose exec frontend-totem npm test
```

## 🔧 Comandos Úteis
```bash
# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend

# Reiniciar um serviço
docker compose restart backend

# Executar migrations
docker compose exec backend python manage.py migrate

# Criar superusuário
docker compose exec backend python manage.py createsuperuser

# Acessar shell do Django
docker compose exec backend python manage.py shell

# Rebuild completo
docker compose down
docker compose up -d --build

# Limpar volumes (CUIDADO: apaga dados)
docker compose down -v
```

## 🐛 Troubleshooting

### Erro de CORS
Verifique se o `ALLOWED_HOSTS` no `.env` inclui o IP do frontend.

### API de rotas não funciona
1. Verifique se `OPENROUTESERVICE_API_KEY` está configurado
2. Reinicie o backend após alterar o `.env`

### Traduções não atualizam
1. Limpe o localStorage do navegador
2. Faça hard refresh (Ctrl+Shift+F5)

### Container não inicia
```bash
docker compose logs <service-name>
```

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- **Issues**: https://github.com/mcoutinho2512/totem-interativo/issues
- **Email**: suporte@sanaris.com.br

## 🙏 Agradecimentos

- [OpenRouteService](https://openrouteservice.org/) - API de rotas
- [OpenStreetMap](https://www.openstreetmap.org/) - Mapas
- [React Leaflet](https://react-leaflet.js.org/) - Componentes de mapa
- [i18next](https://www.i18next.com/) - Internacionalização

---

Desenvolvido com ❤️ por [Sanaris](https://github.com/mcoutinho2512)
