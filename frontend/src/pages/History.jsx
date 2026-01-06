import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";

const labelClass = "text-xs uppercase tracking-wide text-slate-500";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toYMD(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

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
      const da = new Date(a.entry_date || a.date || a.created_at || 0).getTime();
      const db = new Date(b.entry_date || b.date || b.created_at || 0).getTime();
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
      const msg =
        err?.response?.data?.error || err?.message || "Failed to load history.";
      setError(msg);

      if (status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadEntryDetail(dateStr) {
    setDetailLoading(true);
    setDetailError("");

    try {
      const res = await axiosClient.get(`/entries/${dateStr}`);
      const entry = res.data?.entry ?? res.data ?? null;
      setSelected(entry);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load entry details.";
      setDetailError(msg);

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
    <Page title="History" subtitle="Browse past mood check-ins.">
      <Nav />

      {loading && (
        <Card>
          <p className="text-slate-600 leading-relaxed">Loading entries…</p>
        </Card>
      )}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50/80 space-y-2">
          <div className="font-medium text-red-800">Couldn’t load history</div>
          <div className="text-sm text-red-700 leading-relaxed">{error}</div>
          <button
            onClick={loadEntries}
            className="mt-2 text-sm px-3 py-2 rounded-full bg-red-700 text-white hover:opacity-90 transition active:scale-[0.98]"
          >
            Try again
          </button>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 space-y-1">
              <div className={labelClass}>Entries</div>
              <div className="text-sm text-slate-600">
                {sortedEntries.length} entr{sortedEntries.length === 1 ? "y" : "ies"}
              </div>
            </div>

            {sortedEntries.length === 0 ? (
              <div className="p-5 text-slate-600 leading-relaxed">
                No entries yet. Head to the dashboard to submit today’s check-in.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {sortedEntries.map((e) => {
                  const dateStr = e.entry_date || e.date;
                  const moodVal = e.mood;

                  const isActive =
                    toYMD(selected?.entry_date || selected?.date) === toYMD(dateStr);

                  return (
                    <li key={toYMD(dateStr) || `${moodVal}-${Math.random()}`}>
                      <button
                        type="button"
                        onClick={() => {
                          const ymd = toYMD(dateStr);
                          if (ymd) loadEntryDetail(ymd);
                          else setDetailError("Invalid date format from entry list.");
                        }}
                        className={
                          "w-full text-left p-4 transition " +
                          (isActive ? "bg-slate-50" : "hover:bg-slate-50")
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-slate-900">
                            {formatDate(dateStr)}
                          </div>
                          <div className="text-sm text-slate-600">
                            Mood: <span className="font-semibold">{moodVal}</span>/5
                          </div>
                        </div>

                        {e.note && (
                          <div className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                            {e.note}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="space-y-1">
              <div className={labelClass}>Entry details</div>
              <div className="text-sm text-slate-600">
                Select an entry to view the full check-in.
              </div>
            </div>

            {detailLoading && (
              <p className="text-slate-600 leading-relaxed">Loading entry…</p>
            )}

            {!detailLoading && detailError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 leading-relaxed">
                {detailError}
              </div>
            )}

            {!detailLoading && !detailError && !selected && (
              <p className="text-slate-600 leading-relaxed">
                Pick an entry from the list on the left.
              </p>
            )}

            {!detailLoading && !detailError && selected && (
              <div className="space-y-3">
                <div className="text-sm text-slate-600">
                  {formatDate(selected.entry_date || selected.date)}
                </div>

                <div className="text-lg font-semibold text-slate-900">
                  Mood: {selected.mood}/5
                </div>

                {selected.prompt && (
                  <div className="space-y-2">
                    <div className={labelClass}>Prompt</div>
                    <div className="leading-relaxed text-slate-900">
                      {selected.prompt}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className={labelClass}>Reflection</div>
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-900">
                    {selected.note || (
                      <span className="text-slate-400">No note.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}
