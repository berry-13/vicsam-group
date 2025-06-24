# VicSam Group API 🚀

API REST moderna per la gestione dei dati del gruppo VicSam, costruita con Node.js ed Express

## 📋 Panoramica

L'API VicSam Group è un server backend robusto che fornisce:
- ✅ Autenticazione JWT sicura
- 📊 Gestione dati con validazione
- 🔒 Middleware di sicurezza avanzati
- 🧪 Suite di test completa
- 📈 Monitoraggio e logging

## 🏗️ Architettura

```mermaid
graph TB
    A[Client] --> B[Express Server]
    B --> C[Middleware Stack]
    C --> D[Rate Limiting]
    C --> E[Authentication]
    C --> F[CORS & Security]
    B --> G[API Routes]
    G --> H[Auth Controller]
    G --> I[Data Controller]
    H --> J[JWT Service]
    I --> K[File Service]
    K --> L[JSON Storage]
```

## 🛠️ Stack Tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| **Runtime** | Node.js 20.x |
| **Framework** | Express.js |
| **Autenticazione** | JWT + bcryptjs |
| **Sicurezza** | Helmet, CORS, Rate Limiting |
| **Validazione** | Joi |
| **Testing** | Jest + Supertest |
| **Development** | Nodemon |

## 🚦 Endpoints API

```mermaid
graph LR
    A[/api] --> B[/auth]
    A --> C[/data]
    A --> D[/health]
    
    B --> E[POST /login]
    B --> F[POST /register]
    
    C --> G[GET /]
    C --> H[POST /]
    C --> I[PUT /:id]
    C --> J[DELETE /:id]
    
    D --> K[GET /]
```

### 🔐 Autenticazione

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login utente |
| `/api/auth/register` | POST | Registrazione utente |

### 📊 Gestione Dati

| Endpoint | Metodo | Descrizione | Auth |
|----------|--------|-------------|------|
| `/api/data` | GET | Ottieni tutti i dati | ✅ |
| `/api/data` | POST | Crea nuovo dato | ✅ |
| `/api/data/:id` | PUT | Aggiorna dato | ✅ |
| `/api/data/:id` | DELETE | Elimina dato | ✅ |

### 🏥 Monitoraggio

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/health` | GET | Stato del server |

## ⚡ Quick Start

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
