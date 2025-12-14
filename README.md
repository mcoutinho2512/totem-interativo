# 🏙️ Sanaris City Totem

Sistema de Totens Interativos para Cidades Inteligentes

## 📋 Requisitos

- Docker e Docker Compose
- Git
- Contas nas APIs (gratuitas):
  - [OpenWeather](https://openweathermap.org/api) - Clima
  - [OpenRouteService](https://openrouteservice.org/) - Rotas

## 🚀 Instalação Rápida (Docker)

### 1. Clone ou copie o projeto para seu servidor

```bash
# No servidor 10.50.30.168
cd /opt
# Copie a pasta sanaris-city-totem para cá
```

### 2. Configure as variáveis de ambiente

```bash
cd sanaris-city-totem/backend
cp .env.example .env
nano .env
```

Edite o arquivo `.env`:
```env
SECRET_KEY=sua-chave-secreta-muito-segura
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,10.50.30.168

DB_NAME=sanaris_totem
DB_USER=postgres
DB_PASSWORD=sua-senha-segura
DB_HOST=db
DB_PORT=5432

REDIS_URL=redis://redis:6379/0

# IMPORTANTE: Adicione suas chaves de API
OPENWEATHER_API_KEY=sua-api-key-do-openweather
OPENROUTESERVICE_API_KEY=sua-api-key-do-openrouteservice

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://10.50.30.168:3000
```

### 3. Inicie os containers

```bash
cd /opt/sanaris-city-totem
docker-compose up -d
```

### 4. Crie o superusuário

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. Acesse o sistema

- **Totem**: http://10.50.30.168:3000
- **Admin Django**: http://10.50.30.168:8000/admin
- **API**: http://10.50.30.168:8000/api/v1/

---

## 🔧 Instalação Manual (Desenvolvimento)

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar banco PostgreSQL com PostGIS
# Criar banco: sanaris_totem

# Copiar e editar .env
cp .env.example .env

# Rodar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000
```

### Frontend Totem

```bash
cd frontend-totem

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar REACT_APP_API_URL

# Iniciar
npm start
```

---

## 📁 Estrutura do Projeto

```
sanaris-city-totem/
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── tenants/        # Multi-tenant (cidades)
│   │   ├── totems/         # Gestão de totens
│   │   ├── content/        # Notícias, eventos, POIs
│   │   ├── navigation/     # Rotas e geocoding
│   │   ├── weather/        # Integração clima
│   │   ├── analytics/      # Estatísticas
│   │   └── advertising/    # Publicidade
│   ├── config/             # Settings Django
│   └── requirements.txt
├── frontend-totem/          # React - Interface do Totem
├── frontend-admin/          # React - Painel Admin
├── docker-compose.yml
└── README.md
```

---

## 🎯 Primeiros Passos Após Instalação

### 1. Acessar Django Admin
- URL: http://10.50.30.168:8000/admin
- Fazer login com superusuário

### 2. Cadastrar uma Cidade
- Menu: Tenants > Cidades > Adicionar
- Preencher: nome, slug, estado, latitude, longitude
- Exemplo para Rio:
  - Nome: Rio de Janeiro
  - Slug: rio-de-janeiro
  - Estado: RJ
  - Latitude: -22.9068
  - Longitude: -43.1729

### 3. Cadastrar um Totem
- Menu: Totems > Totems > Adicionar
- Vincular à cidade criada
- Identificador único (ex: TOTEM-001)

### 4. Configurar o Frontend
- Editar `frontend-totem/.env`
- Definir `REACT_APP_TOTEM_IDENTIFIER=TOTEM-001`

### 5. Adicionar Conteúdo
- Cadastrar imagens na galeria
- Cadastrar notícias
- Cadastrar eventos
- Cadastrar pontos de interesse

---

## 🔑 APIs Utilizadas

| API | Uso | Plano Free |
|-----|-----|------------|
| OpenWeather | Clima | 1.000 req/dia |
| OpenRouteService | Rotas | 2.000 req/dia |
| OpenStreetMap | Mapas | Ilimitado |
| Nominatim | Geocoding | 1 req/s |

---

## 📊 Endpoints da API

```
GET  /api/v1/core/health/           # Health check
GET  /api/v1/tenants/cities/        # Listar cidades
POST /api/v1/totems/identify/       # Identificar totem
GET  /api/v1/weather/current/       # Clima atual
GET  /api/v1/weather/forecast/      # Previsão
POST /api/v1/navigation/route/      # Calcular rota
GET  /api/v1/navigation/geocode/    # Buscar endereço
GET  /api/v1/content/news/          # Notícias
GET  /api/v1/content/events/        # Eventos
GET  /api/v1/content/pois/          # Pontos de interesse
```

---

## 🐛 Troubleshooting

### Erro de conexão com banco
```bash
docker-compose logs db
docker-compose exec db psql -U postgres -c "SELECT 1"
```

### Erro de CORS
- Verificar `CORS_ALLOWED_ORIGINS` no `.env`
- Reiniciar: `docker-compose restart backend`

### Frontend não conecta na API
- Verificar `REACT_APP_API_URL` no frontend
- Verificar se backend está rodando: `curl http://localhost:8000/api/v1/core/health/`

---

## 📝 Licença

Projeto desenvolvido para uso interno.

---

## 🤝 Suporte

Desenvolvido por Sanaris | 2024
