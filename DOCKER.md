# Docker Deployment Guide

Questa guida spiega come utilizzare le immagini Docker dell'applicazione VicSam Group API pubblicate su GitHub Container Registry.

## 📦 Immagini Disponibili

Le immagini Docker sono pubblicate automaticamente su GitHub Container Registry:

```
ghcr.io/your-username/vicsam-group:latest        # Ultima versione stabile
ghcr.io/your-username/vicsam-group:main         # Branch main
ghcr.io/your-username/vicsam-group:develop      # Branch develop
ghcr.io/your-username/vicsam-group:v1.0.0       # Versioni specifiche
```

## 🚀 Quick Start

### Metodo 1: Docker Run

```bash
# Pull dell'immagine
docker pull ghcr.io/your-username/vicsam-group:latest

# Esecuzione del container
docker run -d \
  --name vicsam-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-jwt-secret-here \
  -e BEARER_TOKEN=your-bearer-token-here \
  -e API_PASSWORD=your-api-password-here \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ghcr.io/your-username/vicsam-group:latest
```

### Metodo 2: Docker Compose (Prebuilt Image)

Usa il file `docker-compose.registry.yml` per utilizzare l'immagine prebuilt:

```bash
# Crea il file .env con le tue variabili
cp .env.example .env

# Modifica le variabili d'ambiente
nano .env

# Avvia il servizio
docker-compose -f docker-compose.registry.yml up -d

# Verifica lo stato
docker-compose -f docker-compose.registry.yml ps

# Visualizza i log
docker-compose -f docker-compose.registry.yml logs -f vicsam-api
```

### Metodo 3: Docker Compose (Build Locale)

Usa il file `docker-compose.yml` standard per build locale:

```bash
# Build e avvio
docker-compose up -d --build

# Solo avvio (se già buildato)
docker-compose up -d
```

## 🔧 Configurazione

### Variabili d'Ambiente Richieste

Crea un file `.env` con le seguenti variabili:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-secure-jwt-secret-here
BEARER_TOKEN=your-secure-bearer-token-here
API_PASSWORD=your-secure-api-password-here
```

### Volumi per Persistenza

L'applicazione utilizza i seguenti volumi per la persistenza dei dati:

- `/app/data` - Dati dell'applicazione
- `/app/logs` - File di log

Esempio di mount dei volumi:

```bash
docker run -d \
  --name vicsam-api \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./logs:/app/logs \
  ghcr.io/your-username/vicsam-group:latest
```

## 🏥 Health Check

L'immagine include un health check automatico che verifica lo stato dell'applicazione:

```bash
# Verifica lo stato del container
docker ps

# Verifica dettagliata del health check
docker inspect --format='{{json .State.Health}}' vicsam-api
```

## 🔒 Autenticazione per Registry Privato

Se il repository è privato, devi autenticarti con GitHub Container Registry:

```bash
# Login con GitHub Personal Access Token
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Oppure con GitHub CLI
gh auth token | docker login ghcr.io -u your-username --password-stdin
```

## 📊 Monitoraggio

### Log dell'Applicazione

```bash
# Visualizza log in real-time
docker logs -f vicsam-api

# Visualizza gli ultimi 100 log
docker logs --tail 100 vicsam-api

# Con Docker Compose
docker-compose logs -f vicsam-api
```

### Metriche del Container

```bash
# Statistiche in real-time
docker stats vicsam-api

# Informazioni dettagliate
docker inspect vicsam-api
```

## 🐛 Troubleshooting

### Container non si avvia

```bash
# Verifica i log per errori
docker logs vicsam-api

# Verifica la configurazione
docker inspect vicsam-api

# Avvia in modalità interattiva per debug
docker run -it --rm \
  -p 3000:3000 \
  ghcr.io/your-username/vicsam-group:latest \
  /bin/sh
```

### Problemi di connessione

```bash
# Verifica che il container sia in ascolto
docker exec vicsam-api netstat -tlnp

# Test della connessione
curl -f http://localhost:3000/health
```

### Aggiornamento dell'Immagine

```bash
# Pull della nuova versione
docker pull ghcr.io/your-username/vicsam-group:latest

# Stop e rimozione del container esistente
docker stop vicsam-api
docker rm vicsam-api

# Avvio con la nuova immagine
docker run -d \
  --name vicsam-api \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./logs:/app/logs \
  ghcr.io/your-username/vicsam-group:latest
```

## 🚀 Deployment in Produzione

### Con Docker Swarm

```bash
# Inizializza swarm
docker swarm init

# Deploy dello stack
docker stack deploy -c docker-compose.registry.yml vicsam

# Verifica il deployment
docker service ls
docker service logs vicsam_vicsam-api
```

### Con Kubernetes

Crea i file manifest Kubernetes:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vicsam-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vicsam-api
  template:
    metadata:
      labels:
        app: vicsam-api
    spec:
      containers:
      - name: vicsam-api
        image: ghcr.io/your-username/vicsam-group:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: vicsam-secrets
              key: jwt-secret
        # ... altre variabili d'ambiente
---
apiVersion: v1
kind: Service
metadata:
  name: vicsam-api-service
spec:
  selector:
    app: vicsam-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 📋 Comandi Utili

```bash
# Verifica versioni disponibili
docker search ghcr.io/your-username/vicsam-group

# Cleanup immagini vecchie
docker image prune -f

# Backup dei volumi
docker run --rm -v vicsam-data:/data -v $(pwd):/backup alpine tar czf /backup/vicsam-data-backup.tar.gz -C /data .

# Restore dei volumi
docker run --rm -v vicsam-data:/data -v $(pwd):/backup alpine tar xzf /backup/vicsam-data-backup.tar.gz -C /data
```

## 🔗 Link Utili

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
