# WhatsApp Wish 🎉

Send personalized festival wishes over WhatsApp. Store each contact with an
**intended name** (e.g. real contact "Lalita Johri" → "Mummy"), then broadcast a
template like `Happy Diwali <Intended Name>` and everyone receives it addressed
to their intended name.

## Architecture

```
React (Vite)  ──HTTP──▶  Spring Boot API  ──HTTP──▶  Node whatsapp-web.js sidecar  ──▶  WhatsApp
  frontend/                 (root, :8080)              whatsapp-service/ (:3000)
                                 │
                                 ▼
                            PostgreSQL (:5432)  ← contacts + intended names
```

- **frontend/** — React UI: manage contacts, compose/preview/send broadcasts, show WhatsApp QR + status.
- **root (Spring Boot)** — REST API, Postgres persistence, per-contact name substitution.
- **whatsapp-service/** — Node service using [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). Owns the WhatsApp Web session (QR login with **your** number) and does the actual sending.
- **PostgreSQL** — stores contacts.

> ⚠️ **Heads-up:** the sidecar automates WhatsApp Web with an unofficial library.
> It works great for a personal tool but is against WhatsApp's Terms of Service and
> can get a number banned if abused. Keep volumes low; a send delay is built in.

## Prerequisites

- Java 21+ (tested on 25) and Maven
- Node.js 18+ and npm
- PostgreSQL — via Docker (`docker compose up`) or `brew install postgresql@16`

## Running (4 terminals)

### 1. Postgres

**Homebrew (recommended, no Docker):** `postgresql@16` is keg-only, so it's not on
your PATH — the setup script uses the full path for you.
```bash
brew install postgresql@16        # if not already installed
brew services start postgresql@16 # start server (restarts at login)
./scripts/setup-db.sh             # create the whatsappwish role + database (idempotent)
```

**Or with Docker** (if you install Docker Desktop):
```bash
docker compose up -d
```

### 2. WhatsApp sidecar
```bash
cd whatsapp-service
npm install      # first time only (uses your installed Google Chrome; see note below)
npm start
```
On first run it prints a QR code and exposes it at http://localhost:3000/status.
Scan it from **WhatsApp → Settings → Linked devices**. The session is saved in
`.wwebjs_auth/` so you won't need to re-scan next time.

> The sidecar uses your installed **Google Chrome** instead of downloading its own
> Chromium (configured in `.puppeteerrc.cjs` + `CHROME_PATH` in `index.js`). If your
> Chrome is elsewhere, set `CHROME_PATH=/path/to/chrome npm start`.

### 3. Backend (Spring Boot)
```bash
mvn spring-boot:run
```
API on http://localhost:8080.

### 4. Frontend
```bash
cd frontend
npm install      # first time only
npm run dev
```
Open http://localhost:5173.

## How to use

1. **Contacts tab** — add contacts: phone number (with country code), optional real
   name, and the **intended name** to address them by.
2. **Broadcast tab** — check the WhatsApp connection (scan the QR if prompted),
   write a message using `<Intended Name>` where the name should go, **Preview** to
   check rendering, then **Send broadcast**. Leave everyone unselected to send to all.

## Message placeholders

In the template, any of these are replaced with the contact's intended name
(case-insensitive): `<Intended Name>`, `<name>`, `{name}`, `{{name}}`.
If none is present, the name is appended at the end.

## Configuration

Backend reads these env vars (defaults in `src/main/resources/application.yml`):

| Var | Default |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/whatsappwish` |
| `DB_USER` / `DB_PASSWORD` | `whatsappwish` / `whatsappwish` |
| `WHATSAPP_SERVICE_URL` | `http://localhost:3000` |
| `SERVER_PORT` | `8080` |

Sidecar: `PORT` (default 3000), `SEND_DELAY_MS` (default 1500).

## API summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/contacts` | list contacts |
| POST | `/api/contacts` | create contact |
| PUT | `/api/contacts/{id}` | update contact |
| DELETE | `/api/contacts/{id}` | delete contact |
| GET | `/api/whatsapp/status` | WhatsApp status + QR |
| POST | `/api/broadcast/preview` | render per-contact, no send |
| POST | `/api/broadcast` | send to selected (or all) contacts |
