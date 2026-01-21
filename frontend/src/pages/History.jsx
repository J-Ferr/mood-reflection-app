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

  // Already YYYY-MM-DD
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeEntry(raw) {
  if (!raw) return null;

  const entry_date =
    raw.entry_date ??
    raw.entryDate ??
    raw.date ??
    raw.entryDateYMD ??
    raw.entry_date_ymd;

  const mood =
    raw.mood ??
    raw.mood_rating ??
    raw.moodRating ??
    raw.rating ??
    raw.score;

  const note =
    raw.note ??
    raw.reflection ??
    raw.text ??
    raw.notes ??
    raw.journal;

  const prompt =
    raw.prompt ??
    raw.question ??
    raw.prompt_text ??
    raw.promptText ??
    raw.prompt_label;

  return {
    ...raw,
    entry_date: entry_date ? toYMD(entry_date) : "",
    mood: mood ?? "",
    note: note ?? "",
    prompt: prompt ?? "",
  };
}

export default function History() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");

  // We store the *entry object* (normalized), not just a date/id
  const [selected, setSelected] = useState(null);

  // Optional: background refresh from /entries/:date (won’t block UI)
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const sortedEntries = useMemo(() => {
    const list = Array.isArray(entries) ? entries : [];
    const normalizedList = list.map(normalizeEntry).filter(Boolean);

    return normalizedList.sort((a, b) => {
      const da = new Date(a.entry_date || 0).getTime();
      const db = new Date(b.entry_date || 0).getTime();
      return db - da;
    });
  }, [entries]);

  async function loadEntries() {
    setLoading(true);
    setError("");

    try {
      const res = await axiosClient.get("/entries");
      const list = res.data?.entries ?? res.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setEntries(arr);
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

  // Optional background refresh (safe)
  async function refreshDetailByDate(rawDateValue) {
    setDetailLoading(true);
    setDetailError("");

    const ymd = toYMD(rawDateValue);
    if (!ymd) {
      setDetailError("Could not parse entry date.");
      setDetailLoading(false);
      return;
    }

    try {
      const res = await axiosClient.get(`/entries/${ymd}`);
      const raw = res.data?.entry ?? res.data ?? null;
      const normalized = normalizeEntry(raw);
      if (normalized) setSelected(normalized);
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

  function handleSelect(entry) {
    const normalized = normalizeEntry(entry);
    setSelected(normalized);
    setDetailError("");

    // Try to refresh details in background, but UI already has data
    if (normalized?.entry_date) {
      refreshDetailByDate(normalized.entry_date);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page title="History" subtitle="Browse past entries">
      <Nav />

      <div className="text-xs text-red-600">HISTORY BUILD: v2-click-fix</div>


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
                {sortedEntries.map((e) => {
                  const isActive =
                    selected?.entry_date && e.entry_date && selected.entry_date === e.entry_date;

                  return (
                    <li key={e.id ?? e.entry_date}>
                      <button
                        className={[
                          "w-full text-left p-4 transition",
                          isActive ? "bg-slate-100" : "hover:bg-slate-50",
                        ].join(" ")}
                        onClick={() => handleSelect(e)}
                      >
                        {formatDate(e.entry_date)} — Mood {e.mood}/5
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Right detail */}
          <Card className="space-y-3">
            {!selected && !detailLoading && !detailError && (
              <div className="text-slate-600">Select an entry</div>
            )}

            {/* Always show selected if we have it */}
            {selected && (
              <>
                <div className="text-sm text-slate-500">
                  {formatDate(selected.entry_date || selected.date)}
                </div>

                <div className="text-lg font-semibold text-slate-900">
                  Mood: {selected.mood}/5
                </div>

                {selected.prompt?.trim() ? (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Prompt:</span> {selected.prompt}
                  </div>
                ) : null}

                <div className="whitespace-pre-wrap leading-relaxed text-slate-900">
                  {selected.note?.trim()
                    ? selected.note
                    : <span className="text-slate-400">No note.</span>}
                </div>
              </>
            )}

            {/* Status messages should NOT hide content */}
            {detailLoading && (
              <div className="text-xs text-slate-500">Loading entry…</div>
            )}

            {!detailLoading && detailError && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {detailError}
              </div>
            )}
          </Card>

        </div>
      )}
    </Page>
  );
}

