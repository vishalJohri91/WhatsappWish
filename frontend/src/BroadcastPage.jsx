import { useEffect, useState } from "react";
import { api } from "./api.js";

const SAMPLE = "Happy Diwali <Intended Name>! 🪔 Wishing you joy and prosperity.";

export default function BroadcastPage() {
  const [status, setStatus] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [template, setTemplate] = useState(SAMPLE);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function refreshStatus() {
    try {
      setStatus(await api.whatsappStatus());
    } catch {
      setStatus({ ready: false, state: "BACKEND_UNREACHABLE", qr: null });
    }
  }

  async function loadContacts() {
    try {
      setContacts(await api.listContacts());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadContacts();
    refreshStatus();
    const t = setInterval(refreshStatus, 4000); // poll for QR scan / ready
    return () => clearInterval(t);
  }, []);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === contacts.length ? new Set() : new Set(contacts.map((c) => c.id))
    );
  }

  function targetIds() {
    // empty selection => send to everyone (backend treats null/empty as all)
    return selected.size === 0 ? null : [...selected];
  }

  async function doPreview() {
    setError(null);
    setResult(null);
    try {
      setPreview(await api.previewBroadcast({ messageTemplate: template, contactIds: targetIds() }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function send() {
    setError(null);
    const count = selected.size === 0 ? contacts.length : selected.size;
    if (count === 0) {
      setError("No contacts to send to. Add some on the Contacts tab.");
      return;
    }
    if (!confirm(`Send this message to ${count} contact(s)?`)) return;
    setSending(true);
    setResult(null);
    try {
      setResult(await api.sendBroadcast({ messageTemplate: template, contactIds: targetIds() }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  const ready = status?.ready;

  return (
    <div className="page">
      <section className="card">
        <h2>WhatsApp connection</h2>
        <ConnectionBanner status={status} />
        {status && !ready && status.qr && (
          <div className="qr-box">
            <p>Scan this QR from WhatsApp → Linked devices:</p>
            <img src={status.qr} alt="WhatsApp QR code" width="240" height="240" />
          </div>
        )}
      </section>

      <section className="card">
        <h2>Compose broadcast</h2>
        <p className="muted">
          Use <code>&lt;Intended Name&gt;</code> where each person's intended name should go.
          Also supports <code>{"{name}"}</code>.
        </p>
        <textarea
          className="template"
          rows={4}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
        <div className="form-actions">
          <button className="btn" onClick={doPreview}>Preview</button>
          <button className="btn primary" onClick={send} disabled={sending || !ready}>
            {sending ? "Sending…" : "Send broadcast"}
          </button>
        </div>
        {!ready && <p className="muted">Connect WhatsApp above before sending.</p>}
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Recipients</h2>
        <p className="muted">
          {selected.size === 0
            ? `Nothing selected — the broadcast goes to ALL ${contacts.length} contact(s).`
            : `${selected.size} selected.`}
        </p>
        {contacts.length > 0 && (
          <label className="check-all">
            <input
              type="checkbox"
              checked={selected.size === contacts.length && contacts.length > 0}
              onChange={toggleAll}
            />
            Select all
          </label>
        )}
        <ul className="recipient-list">
          {contacts.map((c) => (
            <li key={c.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                />
                <strong>{c.intendedName}</strong>{" "}
                <span className="muted">({c.whatsappName || c.phoneNumber})</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {preview && <ResultTable title="Preview" result={preview} />}
      {result && <ResultTable title="Send results" result={result} />}
    </div>
  );
}

function ConnectionBanner({ status }) {
  if (!status) return <p className="muted">Checking…</p>;
  if (status.ready) return <p className="badge ok">Connected ✓ ({status.state})</p>;
  const labels = {
    SIDECAR_UNREACHABLE: "WhatsApp service is not running (start whatsapp-service).",
    BACKEND_UNREACHABLE: "Cannot reach the backend.",
    QR: "Waiting for QR scan…",
    INITIALIZING: "Starting up…",
  };
  return <p className="badge warn">{labels[status.state] || status.state}</p>;
}

function ResultTable({ title, result }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="muted">
        Total {result.total}
        {result.sent > 0 && ` · Sent ${result.sent}`}
        {result.failed > 0 && ` · Failed ${result.failed}`}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Message</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {result.results.map((r, i) => (
            <tr key={i}>
              <td>{r.intendedName}</td>
              <td>{r.phoneNumber}</td>
              <td>{r.renderedMessage}</td>
              <td>
                <span className={statusClass(r.status)}>{r.status}</span>
                {r.error && <div className="error small">{r.error}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function statusClass(status) {
  if (status === "SENT") return "badge ok";
  if (status === "FAILED") return "badge err";
  return "badge";
}
