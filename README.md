# WhatsApp Wish 🎉

![Java](https://img.shields.io/badge/Java-25-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1)

> _A personal hobby project — built for fun to scratch a real itch. My more
> substantial professional work is covered by an NDA and can't be shared publicly,
> so this is a small, self-contained app I can walk through end to end._

Send personalized festival wishes over WhatsApp. Store each contact with an
**intended name** (e.g. real contact "Marko Ruffalo" → "Marky"), then broadcast a
template like `Happy Diwali <Intended Name>` and everyone receives it addressed
to their intended name.

## What this does

Around festivals and special occasions, most of us want to wish a long list of
friends and family — but copy-pasting the same message to dozens of people feels
impersonal, and typing each one by hand takes forever. WhatsApp Wish solves that:
you write **one** message once, and it goes out to everyone individually, each
person greeted by the exact name you'd normally call them.

Here's the idea in everyday terms:

- **Keep an address book.** Save the people you want to wish. For each person you
  store their phone number, optionally their real name, and — most importantly —
  the **name you actually address them by** (their "intended name"). So "Marko
  Ruffalo" might be saved as "Marky", a parent might be "Mom", a friend as a
  nickname, and so on.
- **Write one greeting with a blank for the name.** Compose something like
  `Happy Diwali <Intended Name>! Wishing you a wonderful year ahead.` The
  `<Intended Name>` part is a placeholder that gets swapped out per person.
- **Group people into channels.** Put contacts into a channel like *Family*,
  *Friends*, or *Colleagues* (each contact belongs to at most one channel). Then
  you can wish a whole channel at once instead of ticking people one by one.
- **Preview before you send.** See exactly how the message will read for each
  contact, so there are no surprises.
- **Send to everyone, a channel, or a chosen few — no double-texting.** Pick any
  mix of channels and individual people; if someone is covered twice (say they're
  in a selected channel *and* ticked individually), they still get the message
  only once. Each person receives a message that looks like it was written just
  for them — "Happy Diwali Marky!", "Happy Diwali Mom!" — sent from **your own**
  WhatsApp account.

Because the messages go out through your normal WhatsApp (you connect it once by
scanning a QR code, just like WhatsApp Web), your contacts see them as ordinary,
personal messages from you — not as some obvious mass broadcast. It's meant as a
personal tool for a single person's own contact list, not a marketing blaster.

## Screenshots

The UI has three tabs — **Broadcast**, **Contacts** (grouped by channel), and
**Channels**. Capture a PNG of each into `docs/screenshots/`, then uncomment the
table below.

<!--
| Broadcast | Contacts | Channels |
| --- | --- | --- |
| ![Broadcast](docs/screenshots/broadcast.png) | ![Contacts](docs/screenshots/contacts.png) | ![Channels](docs/screenshots/channels.png) |
-->

## Architecture

```
React (Vite)  ──HTTP──▶  Spring Boot API  ──HTTP──▶  Node whatsapp-web.js sidecar  ──▶  WhatsApp
  frontend/                 (root, :8080)              whatsapp-service/ (:3000)
                                 │
                                 ▼
                            PostgreSQL (:5432)  ← contacts, channels + intended names
```

- **frontend/** — React UI: manage contacts and channels, compose/preview/send broadcasts, show WhatsApp QR + status.
- **root (Spring Boot)** — REST API, Postgres persistence, per-contact name substitution.
- **whatsapp-service/** — Node service using [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). Owns the WhatsApp Web session (QR login with **your** number) and does the actual sending.
- **PostgreSQL** — stores contacts and channels.

> ⚠️ **Heads-up:** the sidecar automates WhatsApp Web with an unofficial library.
> It works great for a personal tool but is against WhatsApp's Terms of Service and
> can get a number banned if abused. Keep volumes low; a send delay is built in.

## Design notes

A few decisions worth calling out:

- **Sidecar over reimplementation.** WhatsApp has no official personal-messaging
  API, so a small Node service ([whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js))
  owns the WhatsApp Web session and the Spring Boot API talks to it over HTTP. This
  isolates the browser-automation concern from the domain/API layer and lets each
  side use the best-fit ecosystem.
- **Deduplicated broadcasts.** Recipients are the union of the selected channels'
  members and any individually selected contacts, deduplicated by contact identity
  in one place (`BroadcastService.resolveTargets`) so nobody is messaged twice.
- **One channel per contact.** Membership is a simple many-to-one, which keeps both
  the UI (a single dropdown, a grouped list) and the queries straightforward.
- **Data integrity at the edges.** The intended name is required at every layer
  (DB `NOT NULL`, Bean Validation `@NotBlank`, and a `required` form field), and a
  startup task purges any legacy rows that slipped through — so message rendering
  can never produce a nameless greeting.
- **Boring, reproducible setup.** Postgres via Docker or Homebrew, an idempotent DB
  bootstrap script, and Hibernate `ddl-auto` for schema — enough for a personal tool
  without migration ceremony.

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
   name, the **intended name** to address them by (required), and optionally the
   **channel** they belong to. The list is grouped by channel (channels A→Z,
   members A→Z, with a "No channel" group last) and has a filter to view one
   channel at a time.
2. **Channels tab** — create, rename, and delete channels. Open **Members** on a
   channel to see who's in it, remove members, or add a contact (adding someone
   who's already in another channel moves them). Deleting a channel never deletes
   the contacts — they just become unassigned.
3. **Broadcast tab** — check the WhatsApp connection (scan the QR if prompted),
   write a message using `<Intended Name>` where the name should go. Pick any mix
   of **channels** and **individual contacts**; the running recipient count is
   deduplicated, and anyone already covered by a selected channel is greyed out in
   the individual list. **Preview** to check rendering, then **Send broadcast**.
   Leave everything unselected to send to all.

## Channels

- A channel is a named group of contacts (e.g. *Family*, *Friends*, *Colleagues*).
  **Fresh databases are seeded with those three;** after that they're fully
  editable.
- A contact belongs to **at most one** channel (or none).
- When broadcasting, recipients are the **union** of the selected channels' members
  and any individually selected contacts, **deduplicated by contact** — nobody gets
  the same message twice.

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
| GET | `/api/contacts` | list contacts (each with its channel) |
| POST | `/api/contacts` | create contact (optional `channelId`) |
| PUT | `/api/contacts/{id}` | update contact (optional `channelId`) |
| DELETE | `/api/contacts/{id}` | delete contact |
| GET | `/api/channels` | list channels (with member count + member ids) |
| GET | `/api/channels/{id}` | get one channel |
| POST | `/api/channels` | create channel |
| PUT | `/api/channels/{id}` | rename channel |
| PUT | `/api/channels/{id}/contacts` | set a channel's full member list |
| DELETE | `/api/channels/{id}` | delete channel (contacts kept) |
| GET | `/api/whatsapp/status` | WhatsApp status + QR |
| POST | `/api/broadcast/preview` | render per-contact, no send |
| POST | `/api/broadcast` | send to selected contacts/channels (or all) |

Both broadcast endpoints accept `contactIds` and `channelIds`; leaving both empty
targets all contacts.
