/**
 * WhatsApp Web sidecar.
 *
 * Owns a whatsapp-web.js session tied to YOUR personal WhatsApp number (via QR login).
 * Exposes a tiny HTTP API the Spring backend calls:
 *   GET  /status        -> { ready, state, qr }   (qr is a data-URL PNG while login is pending)
 *   POST /send          -> { phone, message }      sends a text message
 *   POST /logout        -> destroys the session
 *
 * NOTE: This automates WhatsApp Web with an unofficial library. It works well for a
 * personal tool, but it is against WhatsApp's Terms of Service and can get a number
 * banned if abused. Keep volumes low and add delays between messages.
 */
const express = require("express");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const PORT = process.env.PORT || 3000;
// Delay between consecutive sends (ms) to look less bot-like. Backend sends sequentially.
const SEND_DELAY_MS = parseInt(process.env.SEND_DELAY_MS || "1500", 10);
// We don't download Puppeteer's Chromium (see .puppeteerrc.cjs); use the system Chrome.
// Override with CHROME_PATH if yours lives elsewhere.
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let currentQrDataUrl = null;
let ready = false;
let state = "INITIALIZING";
let client; // assigned in start(), after we resolve a known-good web version

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * whatsapp-web.js logs in fine but often never fires "ready" when the installed
 * library is a step behind WhatsApp Web's current build. Pinning a known-good web
 * version (served by the community wa-version repo) fixes that. We fetch the latest
 * available snapshot at startup; this runs in YOUR environment so it reaches GitHub.
 * Override with WWEB_VERSION=2.3000.xxxxxxxxxx to force a specific one.
 */
async function fetchLatestWebVersion() {
  if (process.env.WWEB_VERSION) return process.env.WWEB_VERSION;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(
      "https://api.github.com/repos/wppconnect-team/wa-version/contents/html?per_page=1000",
      { headers: { "User-Agent": "whatsapp-wish" }, signal: ctrl.signal }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    const files = await res.json();
    const all = files
      .map((f) => f.name)
      .filter((n) => /^2\.3000\.\d+.*\.html$/.test(n))
      .map((n) => n.replace(/\.html$/, ""))
      .sort((a, b) => parseInt(a.split(".")[2], 10) - parseInt(b.split(".")[2], 10));
    // Prefer the latest STABLE (non-alpha) build — alpha builds are often ahead of
    // what whatsapp-web.js can drive, which stops the "ready" event from firing.
    const stable = all.filter((v) => !/-alpha/i.test(v));
    const chosen = stable.length ? stable[stable.length - 1] : all[all.length - 1];
    return chosen || null;
  } finally {
    clearTimeout(timer);
  }
}

function attachHandlers(c) {
  c.on("qr", async (qr) => {
    state = "QR";
    ready = false;
    qrcodeTerminal.generate(qr, { small: true });
    try {
      currentQrDataUrl = await qrcode.toDataURL(qr);
      console.log("[whatsapp] QR ready — scan above, or from the app's Broadcast tab.");
    } catch (err) {
      console.error("[whatsapp] failed to render QR:", err.message);
    }
  });

  c.on("loading_screen", (percent, message) => {
    state = "LOADING";
    console.log(`[whatsapp] loading ${percent}% ${message || ""}`);
  });

  c.on("change_state", (s) => {
    console.log("[whatsapp] state changed:", s);
  });

  c.on("authenticated", () => {
    state = "AUTHENTICATED";
    currentQrDataUrl = null;
    console.log("[whatsapp] authenticated.");
  });

  c.on("ready", () => {
    ready = true;
    state = "READY";
    currentQrDataUrl = null;
    console.log("[whatsapp] client is ready.");
  });

  c.on("auth_failure", (msg) => {
    ready = false;
    state = "AUTH_FAILURE";
    console.error("[whatsapp] auth failure:", msg);
  });

  c.on("disconnected", (reason) => {
    ready = false;
    state = "DISCONNECTED";
    console.warn("[whatsapp] disconnected:", reason);
  });
}

async function start() {
  let webVersion = null;
  try {
    webVersion = await fetchLatestWebVersion();
    if (webVersion) console.log("[whatsapp] pinning WhatsApp Web version:", webVersion);
  } catch (err) {
    console.warn("[whatsapp] could not resolve latest web version, using default:", err.message);
  }

  const options = {
    authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
    puppeteer: {
      headless: true,
      executablePath: CHROME_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  };
  if (webVersion) {
    options.webVersion = webVersion;
    options.webVersionCache = {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html",
    };
  }

  client = new Client(options);
  attachHandlers(client);
  client.initialize();

  // Safety net: on some library/web-version combos the "ready" event is flaky or
  // never fires even though the client is CONNECTED. Poll getState() and promote to
  // ready ourselves once WhatsApp reports CONNECTED.
  const readyPoll = setInterval(async () => {
    if (ready || !client) return;
    try {
      const s = await client.getState(); // throws until the page is usable
      if (s === "CONNECTED") {
        ready = true;
        state = "READY";
        console.log("[whatsapp] client is ready (via state poll).");
      }
    } catch {
      // page/store not ready yet — ignore and try again next tick
    }
  }, 3000);
  readyPoll.unref?.();
}

start();


/** Converts a phone number to a WhatsApp chat id, e.g. "919812345678" -> "919812345678@c.us". */
function toChatId(phone) {
  const digits = String(phone).replace(/[^0-9]/g, "");
  return `${digits}@c.us`;
}

// Right after login WhatsApp Web is still syncing and can swap out internal
// Puppeteer frames mid-call, throwing errors like "detached Frame" or
// "Execution context was destroyed". These are transient — retry a few times.
const TRANSIENT = /detached Frame|Execution context was destroyed|Target closed|Session closed|Protocol error/i;

async function withRetry(fn, { attempts = 3, delay = 2000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String(err && err.message);
      if (!TRANSIENT.test(msg) || i === attempts - 1) throw err;
      console.warn(`[whatsapp] transient error, retry ${i + 1}/${attempts}: ${msg}`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

const app = express();
app.use(express.json());

app.get("/status", (_req, res) => {
  res.json({ ready, state, qr: currentQrDataUrl });
});

app.post("/send", async (req, res) => {
  const { phone, message } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ error: "phone and message are required" });
  }
  if (!ready) {
    return res.status(503).json({ error: `WhatsApp not ready (state: ${state})` });
  }

  const chatId = toChatId(phone);
  try {
    // Best-effort "is on WhatsApp?" check. If the check itself hits a transient
    // frame error we don't want to fail the send, so swallow check-only errors.
    try {
      const registered = await withRetry(() => client.isRegisteredUser(chatId), { attempts: 2 });
      if (!registered) {
        return res.status(422).json({ error: "Number is not on WhatsApp" });
      }
    } catch (checkErr) {
      console.warn("[whatsapp] registration check failed, sending anyway:", checkErr.message);
    }

    const sent = await withRetry(() => client.sendMessage(chatId, message), { attempts: 3 });
    await sleep(SEND_DELAY_MS);
    // Some whatsapp-web.js versions resolve without the full message object even
    // though the message was delivered — don't fail just because we can't read the id.
    const id = sent && sent.id ? sent.id._serialized : null;
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("[whatsapp] send failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/logout", async (_req, res) => {
  if (!client) {
    return res.status(503).json({ error: "WhatsApp client not initialized yet" });
  }
  try {
    await client.logout();
    ready = false;
    state = "LOGGED_OUT";
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[whatsapp] sidecar listening on http://localhost:${PORT}`);
});
