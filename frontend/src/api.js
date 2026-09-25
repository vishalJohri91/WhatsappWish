// Small fetch wrapper around the backend API (proxied via Vite at /api).

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.message) message = body.message;
    } catch {
      // non-JSON error body; keep default message
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listContacts: () => request("/contacts"),
  createContact: (data) => request("/contacts", { method: "POST", body: JSON.stringify(data) }),
  updateContact: (id, data) =>
    request(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: "DELETE" }),

  listChannels: () => request("/channels"),
  getChannel: (id) => request(`/channels/${id}`),
  createChannel: (data) => request("/channels", { method: "POST", body: JSON.stringify(data) }),
  updateChannel: (id, data) =>
    request(`/channels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChannel: (id) => request(`/channels/${id}`, { method: "DELETE" }),
  setChannelContacts: (id, contactIds) =>
    request(`/channels/${id}/contacts`, { method: "PUT", body: JSON.stringify({ contactIds }) }),

  whatsappStatus: () => request("/whatsapp/status"),
  previewBroadcast: (data) =>
    request("/broadcast/preview", { method: "POST", body: JSON.stringify(data) }),
  sendBroadcast: (data) =>
    request("/broadcast", { method: "POST", body: JSON.stringify(data) }),
};
