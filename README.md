# VicSam Group Platform

Piattaforma moderna per file hosting e gestione autenticazione con sistema JWT avanzato.

## 📋 Panoramica

La piattaforma VicSam Group è una soluzione ottimizzata che include:

### Backend API
- ✅ **Sistema di autenticazione moderno** con JWT e Bearer Token diretto
- 📁 **File Hosting / URL Shortener** per file ZIP ed EXE
- 🔒 **Sicurezza avanzata** con autenticazione a doppio livello
- 🚀 **Performance ottimizzate** con caching e compressione
- 📊 **Sistema completo di gestione utenti** con ruoli e permessi
- 🧪 **API REST** ben documentate
- 🔄 **Rate limiting** e protezione anti-abuse

### File Hosting Features
- 📦 **ZIP Downloads** via `/get` endpoint
- 💻 **EXE Downloads** via `/app` endpoint  
- ⚡ **URL Shortener** per facile accesso ai file
- 🗜️ **Compressione automatica** per file di grandi dimensioni
- 📊 **Statistiche download** con privacy-compliant logging
- 🔐 **Controllo accessi** opzionale

### Sistema di Autenticazione
- 🎯 **JWT moderno** con algoritmo RS256
- 🔑 **Bearer Token diretto** per accesso API semplificato
- 👥 **Gestione utenti completa** con registrazione/login
- 🛡️ **Ruoli e permessi** granulari
- 📝 **Audit logging** completo
- 🔄 **Token refresh** automatico

## 🚀 Quick Start

### Configurazione File Hosting

1. **Crea la cartella files:**
```bash
mkdir files
```

2. **Aggiungi i tuoi file:**
- `files/download.zip` - Accessibile via `/get`
- `files/app.exe` - Accessibile via `/app`

3. **Configura .env:**
```bash
BEARER_TOKEN=your-secure-bearer-token-here
DOWNLOAD_GET_FILE=files/download.zip
DOWNLOAD_APP_FILE=files/app.exe
```

4. **Avvia il server:**
```bash
npm install
npm start
```

### URL Shortener Usage

- `GET /get` - Download del file ZIP
- `GET /app` - Download del file EXE
- `GET /downloads/info` - Informazioni sui file disponibili

### Autenticazione

**JWT System (Raccomandato):**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Uso del JWT token
curl -H "Authorization: Bearer <jwt-token>" \
  http://localhost:3000/api/auth/verify
```

**Bearer Token Diretto:**
```bash
curl -H "Authorization: Bearer your-bearer-token" \
  http://localhost:3000/api/auth/verify
```

## 🏗️ Architettura

```mermaid
graph TB
    A[React Frontend] --> B[Express Server]
    B --> C[Middleware Stack]
    C --> D[Rate Limiting]
    C --> E[Dual Authentication]
    C --> F[CORS & Security]
    B --> G[API Routes]
    G --> H[Auth Controller]
    G --> I[Data Controller]
    H --> J[JWT Service]
    I --> K[File Service]
    K --> L[JSON Storage]
    
    subgraph "Frontend Features"
        M[Dashboard]
        N[File Manager]
        O[Data Upload]
        P[Settings]
        Q[Auth System]
    end
    
    A --> M
    A --> N
    A --> O
    A --> P
    A --> Q
```

## 🛠️ Stack Tecnologico

### Backend
| Categoria | Tecnologia |
|-----------|------------|
| **Runtime** | Node.js 20.x |
| **Framework** | Express.js |
| **Autenticazione** | JWT + bcryptjs |
| **Sicurezza** | Helmet, CORS, Rate Limiting |
| **Validazione** | Joi |
| **Testing** | Jest + Supertest |
| **Development** | Nodemon |

### Frontend
| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui + Radix UI |
| **Routing** | React Router |
| **State Management** | React Context |
| **HTTP Client** | Axios |
| **Icons** | Lucide React |

### Database
| Categoria | Supporto |
|-----------|----------|
| **Primario** | MySQL 5.7+ / MariaDB 10.x |
| **PostgreSQL** | ✅ Supportato (STRING_AGG) |
| **SQLite** | ✅ Supportato (GROUP_CONCAT) |
| **SQL Server** | ✅ Supportato (STRING_AGG) |
| **Compatibilità** | Query database-agnostic con rilevamento automatico |
| **Pool Connessioni** | mysql2/promise con connection pooling |

### Cache & Storage
| Categoria | Supporto |
|-----------|----------|
| **Redis** | Token rotation storage (raccomandato) |
| **Fallback** | In-memory storage se Redis non disponibile |
| **Configurazione** | REDIS_URL environment variable |
| **Pool Connessioni** | mysql2/promise con connection pooling |

> **Nota**: Il sistema usa aggregazione di stringhe database-agnostica che si adatta automaticamente al tipo di database rilevato tramite driver o configurazione ambiente.
> 
> **Requisiti MySQL**: Il sistema supporta MySQL 5.7+ utilizzando trigger BEFORE INSERT per la generazione automatica di UUID. Per MySQL 8.0.13+ è disponibile il supporto nativo per DEFAULT (UUID()).

## 🚦 API Endpoints

### Autenticazione
```http
POST /api/auth/login
Content-Type: application/json

{
  "password": "vicsam-test"
}
```
**Risposta:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "bearerToken": "htQ3G3Zyc1Z5TwhlbpQ9ga5gsomsQRobKWWgXSLdU5e1P8z3T7lx6rU7FbjvyYVL",
    "expiresIn": "24h"
  },
  "message": "🎉 Autenticazione completata con successo!"
}
```

```http
GET /api/auth/verify
Authorization: Bearer htQ3G3Zyc1Z5TwhlbpQ9ga5gsomsQRobKWWgXSLdU5e1P8z3T7lx6rU7FbjvyYVL
```

```http
GET /api/auth/info
```
Ritorna informazioni pubbliche sull'API.

```http
GET /api/auth/debug
```
Endpoint di debug per sviluppo.

### Gestione Dati
Tutti gli endpoint richiedono autenticazione Bearer Token.

```http
POST /api/data/save
Authorization: Bearer {bearerToken}
Content-Type: application/json

{
  "CustomerVAT": "02638030961",
  "CompanyName": "Vicsam Group",
  "data": {...}
}
```
## 🖥️ Interfaccia Web

### Dashboard
- 📊 **Statistiche** in tempo reale
- 📈 **Grafici** di utilizzo
- 🔄 **Refresh** automatico dei dati
- 📱 **Design responsive**

### File Explorer
- 📁 **Visualizzazione** lista file
- 👀 **Preview** contenuto JSON
- ⬇️ **Download** diretto
- 🗑️ **Eliminazione** file
- 🔍 **Ricerca** e filtri

### Upload Dati
- 📤 **Drag & Drop** per file JSON
- 📝 **Upload multipli** simultanei
- ✅ **Validazione** automatica
- 📊 **Feedback** in tempo reale

### Impostazioni
- 🌙 **Dark/Light mode**
- ⚙️ **Configurazione** API
- 🔑 **Gestione token**
- 💾 **Salvataggio** preferenze

## 🚀 Avvio Rapido

### Prerequisiti
- Node.js 18+ 
- npm o yarn

### Installazione
```bash
# Clone del repository
git clone <repository-url>
cd vicsam-group

# Installa dipendenze backend
npm install

# Installa dipendenze frontend
cd client
npm install
cd ..

# Copia e configura ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni
```

### Sviluppo
```bash
# Avvia server backend
npm run dev

# In un nuovo terminale, avvia client
npm run dev:client

# Oppure avvia entrambi simultaneamente
npm run dev:full
```

### Produzione
```bash
# Build del client
npm run build

# Avvia server in produzione
npm start
```

## 🏭 Deploy con PM2

### Setup Server
```bash
# Installa PM2
npm install -g pm2

# Clone e setup
git clone <repository-url> vicsam-group
cd vicsam-group
npm install --production
cd client && npm install && cd ..
npm run build
```

### Configurazione PM2
```bash
# Avvia con PM2
pm2 start ecosystem.config.js --env production

# Salva configurazione
pm2 save

# Setup avvio automatico
pm2 startup
```

### Monitoraggio
```bash
# Status applicazioni
pm2 status

# Log in tempo reale
pm2 logs

# Monitoring dashboard
pm2 monit
```

## 🧪 Testing

### Esecuzione Test
```bash
# Test singoli
npm test

# Test con coverage
npm run test:ci

# Test in watch mode
npm run test:watch
```

### Test Coverage
Il progetto include test completi per:
- ✅ **Controllers** (Auth, Data)
- ✅ **Middleware** (Auth, Validation)
- ✅ **Services** (File operations)
- ✅ **Routes** (API endpoints)
- ✅ **Utils** (Helpers, JWT)

## � Monitoraggio e Logging

### Logging Strutturato
- 📝 **Request logging** con dettagli completi
- 🐛 **Debug logs** per development
- ❌ **Error tracking** con stack traces
- 📈 **Performance metrics**

### Health Monitoring
- 🏥 **Health endpoint** (`/health`)
- ⏱️ **Uptime tracking**
- 💾 **Memory usage**
- 🔄 **Request statistics**

## 🔧 Configurazione

### Variabili Ambiente
```env
# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Authentication
API_PASSWORD=your-api-password
BEARER_TOKEN=your-bearer-token
API_KEY=optional-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*
```

### Personalizzazione
- 🎨 **Temi** personalizzabili
- 🌐 **Multi-language** ready
- 📱 **PWA** compatible
- 🔧 **Plugin** architecture

## 🛡️ Sicurezza

### Misure Implementate
- 🔒 **Helmet.js** per header sicuri
- 🚫 **Rate Limiting** per prevenire abuse
- 🔐 **JWT** per autenticazione stateless
- 🛡️ **CORS** configurabile
- 📝 **Input validation** con Joi
- 🔒 **Password hashing** con bcrypt

## 📈 Performance

### Ottimizzazioni Backend
- ⚡ **Response caching**
- 📦 **Compression** middleware
- � **Connection pooling**
- 📊 **Memory management**

### Ottimizzazioni Frontend
- 🚀 **Vite** per build ultra-veloci
- 📦 **Code splitting** automatico
- 🖼️ **Asset optimization**
- 💾 **Service Worker** per caching

## 🤝 Contribuire

### Sviluppo
1. Fork del repository
2. Crea feature branch
3. Commit delle modifiche
4. Push e Pull Request

### Coding Standards
- 📝 **ESLint** per linting
- 🎨 **Prettier** per formatting
- 📋 **TypeScript** per type safety
- 🧪 **Test coverage** > 80%

## 📝 Changelog

### v2.0.0 (Corrente)
- ✨ **Frontend React** completo
- 🔐 **Dual authentication** system
- 📁 **File management** avanzato
- 📊 **Dashboard** con statistiche
- 🎨 **UI moderna** con shadcn/ui
- 🌙 **Dark mode** support

### v1.0.0
- 🚀 **API base** con Express
- 🔐 **JWT authentication**
- 📁 **File storage** JSON
- 🧪 **Test suite** completa

---

**Vicsam Group Platform** - Gestione dati moderna e sicura 🚀
    
    B --> E["POST /login"]
    B --> F["POST /register"]
    B --> G["GET /verify"]
    
    C --> H["POST /save"]
    C --> I["GET /files"]
    C --> J["GET /file/:filename"]
    C --> K["DELETE /file/:filename"]
    C --> L["GET /stats"]
    
    D --> M["GET /"]
```

### 🔐 Autenticazione

| Endpoint | Metodo | Descrizione | Auth |
|----------|--------|-------------|------|
| `/api/auth/login` | POST | Login con password | ❌ |
| `/api/auth/verify` | GET | Verifica token Bearer | ✅ |

### 📊 Gestione Dati

| Endpoint | Metodo | Descrizione | Auth |
|----------|--------|-------------|------|
| `/api/data/save` | POST | Salva nuovi dati | ✅ |
| `/api/data/files` | GET | Lista tutti i file | ✅ |
| `/api/data/file/:filename` | GET | Contenuto di un file | ✅ |
| `/api/data/file/:filename` | DELETE | Elimina un file | ✅ |
| `/api/data/stats` | GET | Statistiche sui dati | ✅ |

### 🏥 Monitoraggio

| Endpoint | Metodo | Descrizione | Auth |
|----------|--------|-------------|------|
| `/health` | GET | Stato del server | ❌ |

## ⚡ Quick Start

### 🐳 Docker (Raccomandato per Produzione)
```bash
# Usa l'immagine prebuilt dal GitHub Container Registry
docker run -d \
  --name vicsam-api \
  -p 3000:3000 \
  -e JWT_SECRET=your-jwt-secret \
  -e BEARER_TOKEN=your-bearer-token \
  -e API_PASSWORD=your-api-password \
  ghcr.io/your-username/vicsam-group:latest

# Oppure con Docker Compose
docker-compose -f docker-compose.registry.yml up -d
```

### GitHub Codespaces (Consigliato per Sviluppo) ☁️
```bash
# Avvio automatico con configurazione Codespaces
./start-codespaces.sh
```

### Sviluppo Locale 💻

#### Build Completo (Raccomandato)
```bash
# Build completo: server + client React
npm run build

# Oppure con lo script dedicato
./build.sh

# Avvia il server con client integrato
npm start
```

#### Solo Server (API-only)
```bash
# Installa solo le dipendenze server
npm install

# Avvia il server in modalità sviluppo
npm run dev

# Oppure avvia il server in produzione
npm start
```

#### Solo Client React
```bash
# Build del client separatamente
npm run build:client

# Oppure sviluppo client standalone
cd client
npm install
npm run dev  # Disponibile su http://localhost:5173
```

**L'API è sempre disponibile su** `http://localhost:3000`

### Installazione
```bash
# Clona il repository
git clone <repository-url>
cd vicsam-group

# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env
```

### Configurazione

Crea un file `.env` nella root del progetto:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

### Avvio

```bash
# Modalità sviluppo (con auto-reload)
npm run dev

# Modalità produzione
npm start
```

Il server sarà disponibile su `http://localhost:3000`

## 🧪 Testing

```bash
# Esegui tutti i test
npm test

# Test in modalità watch
npm run test:watch

# Test con coverage
npm run test:coverage

# Test per CI/CD
npm run test:ci
```

## 🔒 Sicurezza

L'API implementa multiple misure di sicurezza:

```mermaid
graph TD
    A[Request] --> B[Helmet Headers]
    B --> C[CORS Policy]
    C --> D[Rate Limiting]
    D --> E[JWT Validation]
    E --> F[Input Validation]
    F --> G[Controller Logic]
```

- **Helmet**: Headers di sicurezza HTTP
- **CORS**: Controllo origine richieste
- **Rate Limiting**: Protezione da attacchi DDoS
- **JWT**: Token sicuri per autenticazione
- **Validation**: Validazione input con Joi

## 📁 Struttura Progetto

```
vicsam-group/
├── 📂 api/
│   ├── 📂 controllers/     # Logic di business
│   ├── 📂 middleware/      # Middleware personalizzati
│   ├── 📂 routes/          # Definizione routes
│   ├── 📂 services/        # Servizi applicativi
│   └── 📂 utils/           # Utilità e helpers
├── 📂 __tests__/           # Suite di test
├── 📂 client/              # Frontend (opzionale)
├── 📄 server.js            # Entry point dell'app
├── 📄 package.json         # Dipendenze e scripts
└── 📄 Dockerfile           # Container Docker
```

## 🐳 Docker

### Build e Run

```bash
# Build dell'immagine
docker build -t vicsam-group-api .

# Run del container
docker run -p 3000:3000 --env-file .env vicsam-group-api

# Con Docker Compose
docker-compose up -d
```

## 🚀 Deployment

### Ambiente di Produzione

1. **Variabili d'ambiente**: Configura tutte le variabili necessarie
2. **SSL/TLS**: Usa un reverse proxy (nginx/Apache)
3. **Process Manager**: Usa PM2 o simili per la gestione dei processi
4. **Monitoring**: Implementa logging e monitoring

### CI/CD

Il progetto include workflow GitHub Actions per:
- ✅ Test automatici sui PR
- 🌙 Test notturni estesi
- 🔍 Scansioni di sicurezza
- 📦 Controllo dipendenze

## 📝 License

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🔗 Link Utili

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Jest Testing Framework](https://jestjs.io/)

---

Sviluppato con ❤️ da Berry
