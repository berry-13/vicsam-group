# Deployment Instructions

Questa guida fornisce istruzioni dettagliate per il deployment dell'applicazione VicSam Group API.

## 🔧 Pre-requisiti

Prima di procedere con il deployment, assicurati di avere:

1. **Docker e Docker Compose** installati
2. **Accesso al GitHub Container Registry** configurato
3. **Variabili d'ambiente** configurate correttamente

## 🐳 GitHub Container Registry

Le immagini Docker sono automaticamente pubblicate su GitHub Container Registry tramite i workflow CI/CD.

### Configurazione Automatica

I workflow CI/CD sono configurati per:

1. **Build automatico** su push/PR ai branch `main` e `develop`
2. **Pubblicazione** delle immagini su GitHub Container Registry
3. **Tagging** automatico basato su branch e versioni
4. **Multi-platform build** (linux/amd64, linux/arm64)
5. **Security scanning** con Trivy
6. **Cleanup automatico** delle immagini vecchie

### Workflow Trigger

I workflow si attivano automaticamente per:

- ✅ Push ai branch `main` e `develop`
- ✅ Pull Request verso `main`
- ✅ Tag di release (`v*.*.*`)
- ✅ Esecuzione manuale

### Immagini Prodotte

| Evento | Tag Immagine | Descrizione |
|--------|--------------|-------------|
| Push `main` | `latest`, `main` | Versione stabile |
| Push `develop` | `develop` | Versione di sviluppo |
| Tag `v1.2.3` | `v1.2.3`, `1.2`, `1` | Release versionate |
| PR | `pr-123` | Test delle PR |

## 🚀 Deployment Rapido

### 1. Con Docker Run

```bash
# Scarica e avvia l'ultima versione
docker run -d \
  --name vicsam-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secure-jwt-secret \
  -e BEARER_TOKEN=your-secure-bearer-token \
  -e API_PASSWORD=your-secure-api-password \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  ghcr.io/your-username/vicsam-group:latest
```

### 2. Con Docker Compose

```bash
# Clona il repository (se necessario)
git clone https://github.com/your-username/vicsam-group.git
cd vicsam-group

# Configura le variabili d'ambiente
cp .env.example .env
nano .env

# Avvia con immagine prebuilt
docker-compose -f docker-compose.registry.yml up -d

# Verifica lo stato
docker-compose -f docker-compose.registry.yml ps
```

## 🔒 Configurazione Sicurezza

### 1. Autenticazione Registry

Per repository privati:

```bash
# Login con GitHub Personal Access Token
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
```

### 2. Variabili d'Ambiente

Crea un file `.env` sicuro:

```env
# Obbligatorio: Cambia questi valori!
JWT_SECRET=your-very-secure-jwt-secret-minimum-32-characters
BEARER_TOKEN=your-secure-bearer-token-for-api-access
API_PASSWORD=your-secure-api-password-for-authentication

# Configurazione applicazione
NODE_ENV=production
PORT=3000

# Opzionale: Configurazioni aggiuntive
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
```

## 🎯 Deployment in Produzione

### 1. Server Singolo

```bash
# Scarica i file di configurazione
wget https://raw.githubusercontent.com/your-username/vicsam-group/main/docker-compose.registry.yml
wget https://raw.githubusercontent.com/your-username/vicsam-group/main/.env.example

# Configura l'ambiente
cp .env.example .env
nano .env  # Inserisci i valori reali

# Avvia il servizio
docker-compose -f docker-compose.registry.yml up -d

# Configura reverse proxy (esempio con Nginx)
sudo nano /etc/nginx/sites-available/vicsam-api
```

Configurazione Nginx di esempio:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Docker Swarm

```bash
# Inizializza Swarm
docker swarm init

# Deploy dello stack
docker stack deploy -c docker-compose.registry.yml vicsam-stack

# Verifica il deployment
docker service ls
docker service logs vicsam-stack_vicsam-api
```

### 3. Kubernetes

```bash
# Applica la configurazione
kubectl apply -f k8s-deployment.yaml

# Verifica il deployment
kubectl get pods -n vicsam-group
kubectl get services -n vicsam-group

# Visualizza i log
kubectl logs -f deployment/vicsam-api -n vicsam-group
```

## 📊 Monitoraggio e Manutenzione

### 1. Health Check

```bash
# Verifica lo stato dell'applicazione
curl -f http://localhost:3000/health

# Con Docker
docker exec vicsam-api curl -f http://localhost:3000/health
```

### 2. Log Monitoring

```bash
# Visualizza log in real-time
docker logs -f vicsam-api

# Con Docker Compose
docker-compose -f docker-compose.registry.yml logs -f vicsam-api

# Salva log su file
docker logs vicsam-api > app.log 2>&1
```

### 3. Aggiornamenti

```bash
# Scarica l'ultima versione
docker pull ghcr.io/your-username/vicsam-group:latest

# Riavvia con la nuova immagine
docker-compose -f docker-compose.registry.yml pull
docker-compose -f docker-compose.registry.yml up -d

# Verifica l'aggiornamento
docker images | grep vicsam-group
```

### 4. Backup

```bash
# Backup dei dati
docker run --rm \
  -v vicsam-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/vicsam-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup automatico (crontab)
0 2 * * * /path/to/backup-script.sh
```

## 🚨 Troubleshooting

### Problemi Comuni

1. **Container non si avvia**
   ```bash
   docker logs vicsam-api
   docker inspect vicsam-api
   ```

2. **Errori di autenticazione registry**
   ```bash
   docker logout ghcr.io
   echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
   ```

3. **Problemi di rete**
   ```bash
   docker network ls
   docker port vicsam-api
   netstat -tlnp | grep 3000
   ```

4. **Problemi di performance**
   ```bash
   docker stats vicsam-api
   docker exec vicsam-api top
   ```

### Log di Debug

Abilita logging dettagliato:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📞 Supporto

Per problemi o domande:

1. Controlla i [GitHub Issues](https://github.com/your-username/vicsam-group/issues)
2. Consulta la [documentazione completa](./README.md)
3. Verifica i [workflow CI/CD](https://github.com/your-username/vicsam-group/actions)

## ✅ Checklist Deployment

- [ ] Variabili d'ambiente configurate
- [ ] Backup dei dati esistenti
- [ ] Test delle connessioni
- [ ] Configurazione reverse proxy
- [ ] Certificati SSL configurati
- [ ] Monitoraggio attivo
- [ ] Procedure di rollback testate
