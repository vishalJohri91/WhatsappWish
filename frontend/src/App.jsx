import { useState } from "react";
import ContactsPage from "./ContactsPage.jsx";
import BroadcastPage from "./BroadcastPage.jsx";
import ChannelsPage from "./ChannelsPage.jsx";

const TABS = [
  { id: "broadcast", label: "Broadcast" },
  { id: "contacts", label: "Contacts" },
  { id: "channels", label: "Channels" },
];

export default function App() {
  const [tab, setTab] = useState("broadcast");

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎉 WhatsApp Wish</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "tab active" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === "broadcast" && <BroadcastPage />}
        {tab === "contacts" && <ContactsPage />}
        {tab === "channels" && <ChannelsPage />}
      </main>
    </div>
  );
}
