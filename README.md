# VicSam Group - API Server Ottimizzato

## 🚀 Panoramica

Server Node.js completamente ristrutturato con API REST sicure e moderne per la gestione dei dati. L'API è stata ottimizzata drasticamente con autenticazione Bearer Token, validazione completa, gestione errori centralizzata e architettura modulare.

## ✨ Caratteristiche Principali

- 🔐 **Autenticazione Bearer Token** sicura
- 🏗️ **Architettura modulare** (MVC pattern)
- ✅ **Validazione completa** con Joi
- 🛡️ **Sicurezza avanzata** (Helmet, CORS, Rate Limiting)
- 📊 **Gestione errori centralizzata**
- 📝 **Logging delle richieste**
- 🩺 **Health check** integrato
- 🔄 **Graceful shutdown**
- 📖 **Documentazione API completa**

## 🏁 Quick Start

### 1. Installazione
```bash
npm install
```

### 2. Configurazione
Copia e modifica il file `.env`:
```bash
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
BEARER_TOKEN=your-bearer-token-change-this
API_PASSWORD=supersegreta
```

### 3. Avvio
```bash
# Produzione
npm start

# Sviluppo con auto-reload
npm run dev
```

### 4. Test API
```bash
# Script di test automatico
./test-api.sh

# Oppure manualmente
curl http://localhost:3000/health
```

## 📚 Documentazione API

### Autenticazione
```bash
# Login per ottenere Bearer Token
POST /api/auth/login
{
  "password": "supersegreta"
}

# Tutte le altre API richiedono:
Authorization: Bearer your-bearer-token-change-this
```

### Endpoint Principali
- `POST /api/data/save` - Salva nuovi dati
- `GET /api/data/files` - Lista file con metadati
- `GET /api/data/file/:filename` - Contenuto file
- `GET /api/data/download/:filename` - Download file
- `DELETE /api/data/file/:filename` - Elimina file
- `GET /api/data/stats` - Statistiche complete

### Esempio Completo
```bash
# 1. Autenticazione
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"supersegreta"}'

# 2. Salvataggio dati
curl -X POST http://localhost:3000/api/data/save \
  -H "Authorization: Bearer your-bearer-token-change-this" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Mario Rossi",
    "email": "mario@example.com",
    "telefono": "123456789"
  }'

# 3. Lista file
curl -X GET http://localhost:3000/api/data/files \
  -H "Authorization: Bearer your-bearer-token-change-this"
```

## 🏗️ Struttura del Progetto

```
├── server.js                 # Server principale
├── .env                      # Configurazione
├── package.json             # Dipendenze
├── test-api.sh              # Script di test
├── API_DOCUMENTATION.md     # Documentazione completa
└── api/
    ├── controllers/         # Logica di business
    │   ├── authController.js
    │   └── dataController.js
    ├── middleware/          # Middleware personalizzati
    │   ├── auth.js
    │   └── common.js
    ├── routes/              # Definizione rotte
    │   ├── index.js
    │   ├── authRoutes.js
    │   └── dataRoutes.js
    ├── services/            # Servizi
    │   └── fileService.js
    └── utils/               # Utility
        ├── helpers.js
        ├── jwt.js
        └── validation.js
```

## 🔒 Sicurezza

### Implementazioni di Sicurezza
- ✅ **Helmet.js** - Header di sicurezza
- ✅ **Rate Limiting** - 100 req/15min per IP
- ✅ **CORS** configurabile
- ✅ **Validazione input** completa
- ✅ **Sanitizzazione file** (no path traversal)
- ✅ **Bearer Token** authentication
- ✅ **JWT** support (per future estensioni)

### Configurazioni Consigliate
```bash
# Produzione - .env
NODE_ENV=production
JWT_SECRET=complex-random-string-min-32-chars
BEARER_TOKEN=secure-random-bearer-token
API_PASSWORD=strong-password-here
```

## 📊 Miglioramenti Implementati

### Dalla Versione Precedente
1. **Architettura**: Da monolitica a modulare MVC
2. **Autenticazione**: Da password in header a Bearer Token
3. **Validazione**: Da controlli manuali a schema Joi
4. **Errori**: Da response scattered a gestione centralizzata
5. **Sicurezza**: Aggiunto Helmet, CORS, Rate Limiting
6. **Logging**: Request/response logging strutturato
7. **Documentazione**: API self-documenting
8. **Testing**: Script automatizzato incluso
9. **Metadata**: File con timestamp, dimensioni, date
10. **Health Check**: Monitoring endpoint integrato

### Prestazioni
- ⚡ Gestione asincrona completa
- 🔄 Graceful shutdown
- 📈 Rate limiting configurabile
- 💾 File system ottimizzato
- 🚀 Risposta JSON strutturata

## 🧪 Testing

### Script Automatico
```bash
./test-api.sh [BASE_URL]
```

### Test Manuali
```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api/auth/info

# Test completo nel file test-api.sh
```

## 🔧 Configurazione Avanzata

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minuti
RATE_LIMIT_MAX_REQUESTS=100  # 100 richieste
```

### CORS
```bash
# Sviluppo: permetti tutto
NODE_ENV=development

# Produzione: solo domini specifici
NODE_ENV=production
```

## 📖 Documentazione Completa

Per la documentazione completa dell'API, consulta:
- 📄 `API_DOCUMENTATION.md` - Guida completa
- 🌐 `GET /api/auth/info` - Info runtime
- 🩺 `GET /health` - Stato server

## 🤝 Compatibilità

✅ **Retrocompatibile** con il frontend esistente
✅ **Endpoint legacy** mantenuti dove possibile
✅ **Stessa struttura dati** per i file salvati

## 📝 Note di Migrazione

Se stai migrando dalla versione precedente:
1. Aggiorna le chiamate API per usare Bearer Token
2. Gestisci le nuove strutture di risposta JSON
3. Configura le nuove variabili d'ambiente
4. Testa con lo script fornito

---

**Developed with ❤️ for VicSam Group**
