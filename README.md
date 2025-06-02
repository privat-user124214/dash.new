
# DiscordNova Bot

Ein fortschrittlicher Discord-Bot mit Web-Dashboard für Server-Management, Verwarnungen und Ticket-System.

## Features

- 🛡️ Verwarnungssystem mit automatischer Eskalation
- 🎫 Ticket-System mit Kategorien
- 📊 Web-Dashboard mit Statistiken
- 🔒 Sichere Authentifizierung über Discord OAuth
- 📱 Responsive Design

## Deployment auf Render.com

### 1. Repository auf GitHub

1. Forke oder clone dieses Repository auf GitHub
2. Stelle sicher, dass alle sensiblen Daten in `.gitignore` stehen

### 2. Render.com Setup

1. Erstelle einen neuen **Web Service** auf [Render.com](https://render.com)
2. Verbinde dein GitHub Repository
3. Verwende folgende Einstellungen:

   **Build Command:**
   ```bash
   npm install && npm run build
   ```

   **Start Command:**
   ```bash
   npm start
   ```

### 3. Umgebungsvariablen auf Render

Setze folgende Umgebungsvariablen in deinem Render.com Dashboard:

- `BOT_TOKEN`: Dein Discord Bot Token
- `DISCORD_CLIENT_ID`: Deine Discord Application Client ID  
- `JWT_SECRET`: Ein sicherer JWT Secret (generiere einen starken String)
- `NODE_ENV`: `production`

### 4. Discord Bot Setup

1. Gehe zum [Discord Developer Portal](https://discord.com/developers/applications)
2. Erstelle eine neue Application oder verwende eine bestehende
3. Gehe zu "Bot" → "Token" → "Reset Token" 
4. Kopiere den neuen Token und setze ihn als `BOT_TOKEN` auf Render
5. Aktiviere alle nötigen **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent

### 5. Bot zu Server hinzufügen

1. Gehe zu "OAuth2" → "URL Generator" im Discord Developer Portal
2. Wähle **Scopes**: `bot`, `applications.commands`
3. Wähle **Bot Permissions**:
   - Send Messages
   - Use Slash Commands
   - Manage Messages
   - Read Message History
   - View Channels
   - Moderate Members
4. Verwende die generierte URL um den Bot zu deinem Server hinzuzufügen

## Lokale Entwicklung

1. Clone das Repository:
   ```bash
   git clone <your-repo-url>
   cd discord-nova
   ```

2. Installiere Dependencies:
   ```bash
   npm install
   ```

3. Erstelle `.env` Datei:
   ```env
   BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   JWT_SECRET=your_jwt_secret_here
   NODE_ENV=development
   ```

4. Starte die Entwicklungsserver:
   ```bash
   npm run dev
   ```

## Technologie Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, TailwindCSS
- **Database**: JSON-basierte Speicherung
- **Discord**: discord.js v14
- **Deployment**: Render.com

## Support

Bei Fragen oder Problemen erstelle ein Issue auf GitHub oder kontaktiere den Entwickler.
