import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";
import formatDate from "../utils/formatDate";

function toYMD(value) {
  if (!value) return "";

  // If it's already YYYY-MM-DD
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // Convert ISO/timestamp/date to YYYY-MM-DD
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function History() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const da = new Date(a.entry_date || a.date || 0).getTime();
      const db = new Date(b.entry_date || b.date || 0).getTime();
      return db - da;
    });
  }, [entries]);

  async function loadEntries() {
    setLoading(true);
    setError("");

    try {
      const res = await axiosClient.get("/entries");
      const list = res.data?.entries ?? res.data ?? [];
      setEntries(Array.isArray(list) ? list : []);
    } catch (err) {
      const status = err?.response?.status;
      setError(err?.response?.data?.error || err?.message || "Failed to load history.");

      if (status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(rawDateValue) {
    setDetailLoading(true);
    setDetailError("");

    const ymd = toYMD(rawDateValue);
    if (!ymd) {
      setDetailError("Could not parse entry date.");
      setDetailLoading(false);
      return;
    }

    try {
      const res = await axiosClient.get(`/entries/${ymd}`); // ✅ always YYYY-MM-DD
      setSelected(res.data?.entry ?? res.data ?? null);
    } catch (err) {
      const status = err?.response?.status;
      setDetailError(
        err?.response?.data?.error || err?.message || "Failed to load entry details."
      );

      if (status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page title="History" subtitle="Browse past entries">
      <Nav />

      {loading && <Card>Loading entries…</Card>}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50/80 space-y-2">
          <div className="font-medium text-red-800">Couldn’t load history</div>
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={loadEntries}
            className="mt-2 text-sm px-3 py-2 rounded-full bg-red-700 text-white hover:opacity-90 transition active:scale-[0.98]"
          >
            Try again
          </button>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left list */}
          <Card className="p-0 overflow-hidden">
            {sortedEntries.length === 0 ? (
              <div className="p-5 text-slate-600">No entries yet.</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {sortedEntries.map((e) => (
                  <li key={toYMD(e.entry_date || e.date) || Math.random()}>
                    <button
                      className="w-full text-left p-4 hover:bg-slate-50 transition"
                      onClick={() => loadDetail(e.entry_date || e.date)} // ✅ pass raw, convert inside
                    >
                      {formatDate(e.entry_date || e.date)} — Mood {e.mood}/5
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Right detail */}
          <Card className="space-y-3">
            {!selected && !detailLoading && !detailError && (
              <div className="text-slate-600">Select an entry</div>
            )}

            {detailLoading && <div className="text-slate-600">Loading entry…</div>}

            {!detailLoading && detailError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {detailError}
              </div>
            )}

            {!detailLoading && !detailError && selected && (
              <>
                <div className="text-sm text-slate-500">
                  {formatDate(selected.entry_date || selected.date)}
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  Mood: {selected.mood}/5
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-900">
                  {selected.note || <span className="text-slate-400">No note.</span>}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}
