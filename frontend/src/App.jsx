import { useState } from "react";
import ContactsPage from "./ContactsPage.jsx";
import BroadcastPage from "./BroadcastPage.jsx";

export default function App() {
  const [tab, setTab] = useState("broadcast");

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎉 WhatsApp Wish</h1>
        <nav className="tabs">
          <button
            className={tab === "broadcast" ? "tab active" : "tab"}
            onClick={() => setTab("broadcast")}
          >
            Broadcast
          </button>
          <button
            className={tab === "contacts" ? "tab active" : "tab"}
            onClick={() => setTab("contacts")}
          >
            Contacts
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === "broadcast" ? <BroadcastPage /> : <ContactsPage />}
      </main>
    </div>
  );
}
