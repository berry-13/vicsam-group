#!/bin/bash

echo "🚀 Avvio deploy Vicsam Group API..."

# Pull delle ultime modifiche
echo "📥 Aggiornamento codice..."
git pull origin main

# Installa dipendenze se necessario
echo "📦 Installazione dipendenze..."
npm install --production

# Build del client
echo "🏗️ Build del client..."
npm run build

# Riavvia PM2
echo "🔄 Riavvio applicazione..."
pm2 restart vicsam-group-api

# Visualizza stato
echo "✅ Deploy completato!"
pm2 status
