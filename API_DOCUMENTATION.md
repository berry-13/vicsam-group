# VicSam Group API - Documentazione

## Panoramica
API completamente ottimizzata e ristrutturata per la gestione sicura dei dati con autenticazione Bearer Token.

## Struttura del Progetto
```
/workspaces/vicsam-group/
├── server.js                 # Server principale
├── .env                      # Variabili d'ambiente
├── package.json             # Dipendenze
└── api/                     # Moduli API
    ├── controllers/         # Logica di business
    ├── middleware/          # Middleware personalizzati
    ├── routes/              # Definizione delle rotte
    ├── services/            # Servizi per gestione dati
    └── utils/               # Utility e helper
```

## Configurazione

### Variabili d'Ambiente (.env)
```bash
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
API_PASSWORD=supersegreta
BEARER_TOKEN=your-bearer-token-change-this
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Autenticazione

### Bearer Token
Tutte le API protette richiedono un Bearer Token nell'header Authorization:
```
Authorization: Bearer your-bearer-token-change-this
```

### Ottenere il Bearer Token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "password": "supersegreta"
}
```

Risposta:
```json
{
  "success": true,
  "message": "Autenticazione completata con successo",
  "data": {
    "token": "jwt-token-here",
    "bearerToken": "your-bearer-token-change-this",
    "expiresIn": "24h"
  },
  "timestamp": "2025-06-24T..."
}
```

## Endpoint API

### Autenticazione
- `POST /api/auth/login` - Login con password
- `GET /api/auth/verify` - Verifica token Bearer
- `GET /api/auth/info` - Informazioni API (pubblico)

### Gestione Dati (Richiedono Bearer Token)
- `POST /api/data/save` - Salva nuovi dati
- `GET /api/data/files` - Lista tutti i file
- `GET /api/data/file/:filename` - Contenuto di un file
- `GET /api/data/download/:filename` - Download file
- `DELETE /api/data/file/:filename` - Elimina file
- `GET /api/data/stats` - Statistiche sui dati

### Health Check
- `GET /health` - Stato del server (pubblico)

## Esempi di Utilizzo

### 1. Salvare Dati
```bash
POST /api/data/save
Authorization: Bearer your-bearer-token-change-this
Content-Type: application/json

{
  "nome": "Mario Rossi",
  "email": "mario@example.com",
  "telefono": "123456789",
  "messaggio": "Dati di esempio"
}
```

### 2. Ottenere Lista File
```bash
GET /api/data/files
Authorization: Bearer your-bearer-token-change-this
```

### 3. Leggere Contenuto File
```bash
GET /api/data/file/dati_1719264000000.json
Authorization: Bearer your-bearer-token-change-this
```

### 4. Download File
```bash
GET /api/data/download/dati_1719264000000.json
Authorization: Bearer your-bearer-token-change-this
```

### 5. Statistiche
```bash
GET /api/data/stats
Authorization: Bearer your-bearer-token-change-this
```

## Formato Risposte

### Successo
```json
{
  "success": true,
  "message": "Messaggio di successo",
  "data": { ... },
  "timestamp": "2025-06-24T..."
}
```

### Errore
```json
{
  "success": false,
  "error": "Messaggio di errore",
  "details": "Dettagli aggiuntivi (opzionale)",
  "timestamp": "2025-06-24T..."
}
```

## Sicurezza

### Caratteristiche di Sicurezza
- ✅ Helmet.js per header di sicurezza
- ✅ Rate limiting (100 richieste per 15 minuti)
- ✅ CORS configurabile
- ✅ Validazione input con Joi
- ✅ Autenticazione Bearer Token
- ✅ Sanitizzazione nomi file
- ✅ Gestione errori centralizzata

### Rate Limiting
- Finestra: 15 minuti (configurabile)
- Limite: 100 richieste per IP (configurabile)
- Solo per endpoint `/api/*`

## Validazione Dati

### Dati di Salvataggio
- `nome`: stringa, 2-100 caratteri, obbligatorio
- `email`: email valida, obbligatorio
- Altri campi: opzionali

### Nomi File
- Solo file `.json`
- Caratteri alfanumerici, underscore, trattino, punto
- Nessun path traversal (`..`)

## Avvio del Server

### Sviluppo
```bash
npm run dev
```

### Produzione
```bash
npm start
```

Il server sarà disponibile su `http://localhost:3000`

## Miglioramenti Implementati

1. **Architettura Modulare**: Separazione MVC con controllers, services, middleware
2. **Autenticazione Robusta**: Bearer Token invece di password in headers
3. **Validazione Completa**: Schema Joi per tutti gli input
4. **Gestione Errori**: Middleware centralizzato per errori
5. **Sicurezza**: Helmet, CORS, rate limiting
6. **Logging**: Request logging per debugging
7. **Documenti JSON**: Metadati sui file (dimensione, date)
8. **Health Check**: Endpoint per monitoraggio
9. **Graceful Shutdown**: Gestione segnali di terminazione
10. **Variabili d'Ambiente**: Configurazione centralizzata

## Note Importanti

⚠️ **SICUREZZA**: Cambia `BEARER_TOKEN` e `JWT_SECRET` in produzione!

⚠️ **BACKUP**: I file `dati_*.json` non sono sotto controllo versione

✅ **COMPATIBILITÀ**: Mantiene compatibilità con il frontend esistente
