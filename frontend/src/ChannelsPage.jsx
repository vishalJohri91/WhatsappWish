import { useEffect, useState } from "react";
import { api } from "./api.js";

const byIntendedName = (a, b) =>
  a.intendedName.localeCompare(b.intendedName, undefined, { sensitivity: "base" });

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [ch, c] = await Promise.all([api.listChannels(), api.listContacts()]);
      setChannels(ch);
      setContacts(c);
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

  async function createChannel(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createChannel({ name: newName.trim() });
      setNewName("");
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  }

  function startRename(channel) {
    setEditingId(channel.id);
    setEditName(channel.name);
  }

  async function saveRename(id) {
    try {
      await api.updateChannel(id, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function removeChannel(id, name) {
    if (!confirm(`Delete the "${name}" channel? Contacts themselves are not deleted.`)) return;
    try {
      await api.deleteChannel(id);
      if (expandedId === id) setExpandedId(null);
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  }

  // Current members of a channel, from the contacts list (the source of truth).
  function membersOf(channelId) {
    return contacts.filter((c) => c.channel && c.channel.id === channelId).sort(byIntendedName);
  }

  async function addMember(channelId, contactId) {
    if (!contactId) return;
    const ids = membersOf(channelId).map((c) => c.id);
    try {
      await api.setChannelContacts(channelId, [...ids, Number(contactId)]);
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function removeMember(channelId, contactId) {
    const ids = membersOf(channelId).map((c) => c.id).filter((id) => id !== contactId);
    try {
      await api.setChannelContacts(channelId, ids);
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h2>Add channel</h2>
        <form onSubmit={createChannel} className="form inline">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Formal Guests"
          />
          <button type="submit" className="btn primary">Add</button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Channels ({channels.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : channels.length === 0 ? (
          <p className="muted">No channels yet. Add one above.</p>
        ) : (
          <ul className="channel-list">
            {channels.map((ch) => {
              const members = membersOf(ch.id);
              // Contacts available to add: everyone not already in this channel.
              const addable = contacts
                .filter((c) => !c.channel || c.channel.id !== ch.id)
                .sort(byIntendedName);
              return (
                <li key={ch.id} className="channel-row">
                  <div className="channel-head">
                    {editingId === ch.id ? (
                      <>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <button className="btn small primary" onClick={() => saveRename(ch.id)}>Save</button>
                        <button className="btn small" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="channel-name">
                          <strong>{ch.name}</strong>{" "}
                          <span className="badge">{ch.memberCount}</span>
                        </span>
                        <button className="btn small" onClick={() =>
                          setExpandedId(expandedId === ch.id ? null : ch.id)
                        }>
                          {expandedId === ch.id ? "Close" : "Members"}
                        </button>
                        <button className="btn small" onClick={() => startRename(ch)}>Rename</button>
                        <button className="btn small danger" onClick={() => removeChannel(ch.id, ch.name)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {expandedId === ch.id && (
                    <div className="member-editor">
                      {members.length === 0 ? (
                        <p className="muted">No members yet.</p>
                      ) : (
                        <ul className="member-list">
                          {members.map((c) => (
                            <li key={c.id}>
                              <span>
                                <strong>{c.intendedName}</strong>{" "}
                                <span className="muted">({c.whatsappName || c.phoneNumber})</span>
                              </span>
                              <button className="btn small danger" onClick={() => removeMember(ch.id, c.id)}>
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {addable.length > 0 && (
                        <label className="add-member">
                          Add a contact
                          <select value="" onChange={(e) => addMember(ch.id, e.target.value)}>
                            <option value="">Choose a contact…</option>
                            {addable.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.intendedName} ({c.whatsappName || c.phoneNumber})
                                {c.channel ? ` — in ${c.channel.name}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
