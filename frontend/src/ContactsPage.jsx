import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const EMPTY = { phoneNumber: "", whatsappName: "", intendedName: "", channelId: "" };

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
const byIntendedName = (a, b) =>
  a.intendedName.localeCompare(b.intendedName, undefined, { sensitivity: "base" });

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "none" | channelId (string)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [c, ch] = await Promise.all([api.listContacts(), api.listChannels()]);
      setContacts(c);
      setChannels(ch);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function change(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(contact) {
    setEditingId(contact.id);
    setForm({
      phoneNumber: contact.phoneNumber,
      whatsappName: contact.whatsappName || "",
      intendedName: contact.intendedName,
      channelId: contact.channel ? String(contact.channel.id) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      phoneNumber: form.phoneNumber,
      whatsappName: form.whatsappName,
      intendedName: form.intendedName,
      channelId: form.channelId ? Number(form.channelId) : null,
    };
    try {
      if (editingId) {
        await api.updateContact(editingId, payload);
      } else {
        await api.createContact(payload);
      }
      cancelEdit();
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this contact?")) return;
    try {
      await api.deleteContact(id);
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  }

  // Build groups: one per channel (alphabetical) plus a trailing "No channel" group,
  // each with its members sorted alphabetically. Respects the active filter.
  const sortedChannels = useMemo(() => [...channels].sort(byName), [channels]);

  const groups = useMemo(() => {
    const result = [];
    for (const ch of sortedChannels) {
      if (filter !== "all" && filter !== String(ch.id)) continue;
      const members = contacts
        .filter((c) => c.channel && c.channel.id === ch.id)
        .sort(byIntendedName);
      result.push({ key: `ch-${ch.id}`, label: ch.name, members });
    }
    if (filter === "all" || filter === "none") {
      const unassigned = contacts.filter((c) => !c.channel).sort(byIntendedName);
      result.push({ key: "none", label: "No channel", members: unassigned });
    }
    return result;
  }, [contacts, sortedChannels, filter]);

  return (
    <div className="page">
      <section className="card">
        <h2>{editingId ? "Edit contact" : "Add contact"}</h2>
        <form onSubmit={submit} className="form">
          <label>
            Phone number (with country code)
            <input
              value={form.phoneNumber}
              onChange={(e) => change("phoneNumber", e.target.value)}
              placeholder="e.g. +91 98123 45678"
              required
            />
          </label>
          <label>
            WhatsApp / real name (optional)
            <input
              value={form.whatsappName}
              onChange={(e) => change("whatsappName", e.target.value)}
              placeholder="e.g. Marko Ruffalo"
            />
          </label>
          <label>
            Intended name (how you address them)
            <input
              value={form.intendedName}
              onChange={(e) => change("intendedName", e.target.value)}
              placeholder="e.g. Marky"
              required
            />
          </label>
          <label>
            Channel
            <select value={form.channelId} onChange={(e) => change("channelId", e.target.value)}>
              <option value="">No channel</option>
              {sortedChannels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {editingId ? "Save" : "Add"}
            </button>
            {editingId && (
              <button type="button" className="btn" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="card-head">
          <h2>Contacts ({contacts.length})</h2>
          <label className="filter">
            Show
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All channels</option>
              {sortedChannels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
              <option value="none">No channel</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="muted">No contacts yet. Add one above.</p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="contact-group">
              <h3 className="group-head">
                {group.label} <span className="badge">{group.members.length}</span>
              </h3>
              {group.members.length === 0 ? (
                <p className="muted">No contacts in this channel.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Intended name</th>
                      <th>Real name</th>
                      <th>Phone</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.members.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.intendedName}</strong></td>
                        <td className="muted">{c.whatsappName || "—"}</td>
                        <td>{c.phoneNumber}</td>
                        <td className="row-actions">
                          <button className="btn small" onClick={() => startEdit(c)}>Edit</button>
                          <button className="btn small danger" onClick={() => remove(c.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
