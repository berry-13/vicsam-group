#!/bin/bash

# Script per avviare l'applicazione Vicsam Group in GitHub Codespaces

echo "🚀 Avvio Vicsam Group per GitHub Codespaces..."

# Controlla se siamo in un ambiente Codespaces
if [[ "$CODESPACE_NAME" != "" ]]; then
    echo "📍 GitHub Codespaces rilevato: $CODESPACE_NAME"
    
    # Costruisci l'URL del backend
    BACKEND_URL="https://$CODESPACE_NAME-3000.preview.app.github.dev"
    echo "🔗 URL Backend: $BACKEND_URL"
    
    # Crea il file .env.local se non esiste
    if [ ! -f "client/.env.local" ]; then
        echo "⚙️ Creazione configurazione automatica..."
        echo "VITE_API_BASE_URL=$BACKEND_URL" > client/.env.local
        echo "VITE_DEBUG=true" >> client/.env.local
        echo "✅ File .env.local creato"
    else
        echo "📝 File .env.local già esistente"
    fi
else
    echo "💻 Ambiente di sviluppo locale rilevato"
fi

# Avvia il backend in background
echo "🔧 Avvio del backend..."
npm start &
BACKEND_PID=$!

# Aspetta che il backend sia pronto
echo "⏳ Attendo che il backend sia pronto..."
sleep 5

# Avvia il frontend
echo "🎨 Avvio del frontend..."
cd client
npm run dev &
FRONTEND_PID=$!

echo "✅ Applicazione avviata!"
echo ""
echo "📊 Backend: http://localhost:3000"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "💡 Suggerimento: Se vedi un banner blu nell'app, clicca su 'Configura Automaticamente'"
echo ""
echo "🛑 Per fermare l'applicazione, premi Ctrl+C"

# Mantieni lo script in esecuzione
wait $BACKEND_PID $FRONTEND_PID
