import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";
import formatDate from "../utils/formatDate";

export default function History() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);

  async function loadEntries() {
    try {
      const res = await axiosClient.get("/entries");
      setEntries(res.data.entries ?? []);
    } catch (err) {
      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login");
      }
    }
  }

  async function loadDetail(date) {
    const res = await axiosClient.get(`/entries/${date}`);
    setSelected(res.data.entry);
  }

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <Page title="History" subtitle="Browse past entries">
      <Nav />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <ul className="divide-y">
            {entries.map((e) => (
              <li key={e.entry_date}>
                <button
                  className="w-full text-left py-3"
                  onClick={() => loadDetail(e.entry_date)}
                >
                  {formatDate(e.entry_date)} — Mood {e.mood}/5
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          {selected ? (
            <>
              <div className="text-sm text-slate-500">
                {formatDate(selected.entry_date)}
              </div>
              <div className="mt-2 whitespace-pre-wrap">
                {selected.note}
              </div>
            </>
          ) : (
            <div>Select an entry</div>
          )}
        </Card>
      </div>
    </Page>
  );
}
