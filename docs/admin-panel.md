# Pannello Admin - Documentazione

## Panoramica

Il Pannello Admin è una interfaccia completa per la gestione del sistema, accessibile solo agli utenti con ruolo di amministratore. Fornisce funzionalità avanzate per il monitoraggio, la gestione degli utenti e la configurazione del sistema.

## Caratteristiche Principali

### 🏠 Dashboard Admin
- **Statistiche del Sistema**: Panoramica in tempo reale degli utenti, ruoli e stato del sistema
- **Indicatori di Salute**: Monitoraggio dello stato di salute del sistema (healthy/warning/critical)
- **Metriche di Attività**: Visualizzazione delle attività recenti (login, registrazioni, errori)

### 👥 Gestione Utenti
- **Visualizzazione Utenti**: Lista completa di tutti gli utenti del sistema
- **Assegnazione Ruoli**: Capacità di assegnare ruoli agli utenti
- **Statistiche Utenti**: Panoramica dei ruoli e permessi assegnati
- **Filtri e Ricerca**: Funzionalità per trovare rapidamente specifici utenti

### 🛡️ Gestione Ruoli
- **Visualizzazione Ruoli**: Lista di tutti i ruoli di sistema
- **Statistiche Ruoli**: Numero di utenti per ogni ruolo
- **Permessi**: Visualizzazione dei permessi associati a ogni ruolo
- **Ruoli di Sistema**: Distinzione tra ruoli di sistema e personalizzati

### 📊 Statistiche di Sistema
- **Metriche Performance**: Monitoraggio delle prestazioni del sistema
- **Attività Utenti**: Statistiche sull'attività degli utenti
- **Stato Componenti**: Controllo dello stato dei componenti critici del sistema

### 📝 Log di Audit
- **Registro Attività**: Log completo di tutte le azioni del sistema
- **Filtri Avanzati**: Ricerca per azione, utente, risorsa e data
- **Export**: Possibilità di esportare i log in formato CSV
- **Sicurezza**: Tracciamento delle azioni per compliance e sicurezza

### ⚙️ Configurazioni di Sistema
- **Impostazioni di Sicurezza**: Configurazione di parametri come tentativi di login, timeout sessioni
- **Controlli Salute**: Verifica dello stato dei servizi (Database, Cache, File System)
- **Backup**: Gestione dei backup del sistema
- **Manutenzione**: Operazioni di manutenzione del sistema

## Accesso e Sicurezza

### Controllo Accessi
- **Solo Amministratori**: Il pannello è accessibile esclusivamente agli utenti con ruolo `admin`
- **Autenticazione Richiesta**: Necessaria autenticazione valida per accedere
- **Controllo Permessi**: Verifica automatica dei permessi per ogni sezione

### Sicurezza
- **Log Audit**: Tutte le azioni dell'admin vengono registrate nei log di audit
- **Sessioni Sicure**: Utilizzo di token JWT sicuri per l'autenticazione
- **Validazione Input**: Validazione rigorosa di tutti gli input utente

## Navigazione

Il pannello admin è organizzato in tab principali:

1. **Users** - Gestione utenti e assegnazione ruoli
2. **Roles** - Visualizzazione e gestione ruoli
3. **Statistics** - Statistiche e metriche di sistema
4. **Audit Logs** - Log di sicurezza e attività
5. **Settings** - Configurazioni di sistema e manutenzione

## Funzionalità Future

### API Endpoints (In sviluppo)
Molte funzionalità utilizzano attualmente dati mock in attesa dell'implementazione completa degli endpoint backend:

- `/api/auth/admin/stats` - Statistiche di sistema
- `/api/auth/admin/audit` - Log di audit
- `/api/auth/admin/settings` - Configurazioni di sistema
- `/api/auth/admin/backup` - Gestione backup
- `/api/auth/admin/health` - Controlli di salute

### Funzionalità Pianificate
- **Notifiche Real-time**: Notifiche push per eventi critici
- **Dashboard Personalizzabili**: Widget configurabili per il dashboard
- **Report Automatici**: Generazione automatica di report periodici
- **Integrazione Monitoring**: Integrazione con sistemi di monitoring esterni

## Utilizzo

### Accesso al Pannello
1. Effettuare login come amministratore
2. Navigare su `/admin` o utilizzare il link "Pannello Admin" nel menu laterale
3. Il sistema verificherà automaticamente i permessi di accesso

### Gestione Utenti
1. Selezionare la tab "Users"
2. Utilizzare i filtri per trovare utenti specifici
3. Cliccare su "Assign Role" per assegnare ruoli
4. Visualizzare statistiche e stato degli utenti

### Monitoraggio Sistema
1. Selezionare la tab "Statistics" per le metriche generali
2. Utilizzare "Settings" per controlli di salute
3. Consultare "Audit Logs" per sicurezza e compliance

## Note Tecniche

### Implementazione
- **Framework**: React con TypeScript
- **UI Components**: Shadcn/ui con Tailwind CSS
- **Icone**: Lucide React
- **Gestione Stato**: React Hooks e Context API
- **Routing**: React Router con protezione delle route

### Compatibilità
- **Browser Moderni**: Compatibile con Chrome, Firefox, Safari, Edge
- **Mobile**: Interfaccia responsive per dispositivi mobili
- **Accessibilità**: Implementazione di best practices per l'accessibilità

## Supporto

Per problemi o domande sul pannello admin:
1. Controllare i log di sistema per errori
2. Verificare lo stato dei servizi nel tab "Settings"
3. Consultare i log di audit per tracciare azioni specifiche
4. Contattare il supporto tecnico se necessario

---

*Ultimo aggiornamento: Luglio 2025*
