import { useEffect, useState } from "react";
import { api } from "./api.js";

const EMPTY = { phoneNumber: "", whatsappName: "", intendedName: "" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setContacts(await api.listContacts());
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
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function submit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateContact(editingId, form);
      } else {
        await api.createContact(form);
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
              placeholder="e.g. Lalita Johri"
            />
          </label>
          <label>
            Intended name (how you address them)
            <input
              value={form.intendedName}
              onChange={(e) => change("intendedName", e.target.value)}
              placeholder="e.g. Mummy"
              required
            />
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
        <h2>Contacts ({contacts.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="muted">No contacts yet. Add one above.</p>
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
              {contacts.map((c) => (
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
      </section>
    </div>
  );
}
