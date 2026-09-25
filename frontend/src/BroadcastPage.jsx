import { useEffect, useState } from "react";
import { api } from "./api.js";

const SAMPLE = "Happy Diwali <Intended Name>! 🪔 Wishing you joy and prosperity.";

export default function BroadcastPage() {
  const [status, setStatus] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectedChannels, setSelectedChannels] = useState(new Set());
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

  async function loadData() {
    try {
      const [c, ch] = await Promise.all([api.listContacts(), api.listChannels()]);
      setContacts(c);
      setChannels(ch);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadData();
    refreshStatus();
    const t = setInterval(refreshStatus, 4000); // poll for QR scan / ready
    return () => clearInterval(t);
  }, []);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === contacts.length ? new Set() : new Set(contacts.map((c) => c.id))
    );
  }

  function toggleChannel(id) {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const nothingSelected = selected.size === 0 && selectedChannels.size === 0;

  // Deduped recipient set (by contact id). null means "everyone".
  function resolvedRecipientIds() {
    if (nothingSelected) return null;
    const set = new Set(selected);
    channels.forEach((ch) => {
      if (selectedChannels.has(ch.id)) (ch.contactIds || []).forEach((id) => set.add(id));
    });
    return set;
  }

  const resolved = resolvedRecipientIds();
  const recipientCount = resolved === null ? contacts.length : resolved.size;

  // Selected channels that have no members (used to warn before sending).
  const emptySelectedChannels = channels.filter(
    (ch) => selectedChannels.has(ch.id) && ch.memberCount === 0
  );

  function requestPayload() {
    return {
      messageTemplate: template,
      contactIds: selected.size === 0 ? null : [...selected],
      channelIds: selectedChannels.size === 0 ? null : [...selectedChannels],
    };
  }

  async function doPreview() {
    setError(null);
    setResult(null);
    try {
      setPreview(await api.previewBroadcast(requestPayload()));
    } catch (e) {
      setError(e.message);
    }
  }

  async function send() {
    setError(null);
    if (recipientCount === 0) {
      setError(
        emptySelectedChannels.length > 0
          ? "The selected channel(s) have no members. Add contacts to them first."
          : "No contacts to send to. Add some on the Contacts tab."
      );
      return;
    }
    if (!confirm(`Send this message to ${recipientCount} contact(s)?`)) return;
    setSending(true);
    setResult(null);
    try {
      setResult(await api.sendBroadcast(requestPayload()));
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
        <p className="recipient-count">
          Sending to <strong>{recipientCount}</strong> {recipientCount === 1 ? "person" : "people"}
          {nothingSelected && " (everyone)"}
        </p>
        {emptySelectedChannels.length > 0 && (
          <p className="badge warn">
            {emptySelectedChannels.map((c) => c.name).join(", ")}{" "}
            {emptySelectedChannels.length === 1 ? "has" : "have"} no members.
          </p>
        )}
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
        <h2>Channels</h2>
        {channels.length === 0 ? (
          <p className="muted">No channels yet. Create some on the Channels tab.</p>
        ) : (
          <ul className="channel-select">
            {channels.map((ch) => (
              <li key={ch.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedChannels.has(ch.id)}
                    onChange={() => toggleChannel(ch.id)}
                  />
                  {ch.name} <span className="badge">{ch.memberCount}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Individual recipients</h2>
        <p className="muted">
          {nothingSelected
            ? `Nothing selected — the broadcast goes to ALL ${contacts.length} contact(s).`
            : `${recipientCount} will receive the message (duplicates removed).`}
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
          {contacts.map((c) => {
            const inSelectedChannel = c.channel && selectedChannels.has(c.channel.id);
            return (
              <li key={c.id} className={inSelectedChannel ? "disabled" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={inSelectedChannel || selected.has(c.id)}
                    disabled={inSelectedChannel}
                    onChange={() => toggle(c.id)}
                  />
                  <strong>{c.intendedName}</strong>{" "}
                  <span className="muted">({c.whatsappName || c.phoneNumber})</span>
                  {inSelectedChannel && <span className="chip">in {c.channel.name}</span>}
                </label>
              </li>
            );
          })}
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
