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
    raw.entry_date ?? raw.entryDate ?? raw.date ?? raw.entryDateYMD ?? raw.entry_date_ymd;

  const mood = raw.mood ?? raw.mood_rating ?? raw.moodRating ?? raw.rating ?? raw.score;

  const note = raw.note ?? raw.reflection ?? raw.text ?? raw.notes ?? raw.journal;

  const prompt = raw.prompt ?? raw.question ?? raw.prompt_text ?? raw.promptText ?? raw.prompt_label;

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

  const [selected, setSelected] = useState(null);

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

      // Keep selection stable if possible after refresh
      if (selected?.id) {
        const next = arr.map(normalizeEntry).find((x) => x?.id === selected.id);
        if (next) setSelected(next);
      }
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
                {sortedEntries.map((e) => {
                  const key = e.id ?? e.entry_date;
                  const isActive =
                    selected?.id ? selected.id === e.id : selected?.entry_date === e.entry_date;

                  return (
                    <li key={key}>
                      <button
                        className={[
                          "w-full text-left p-4 transition",
                          isActive ? "bg-slate-100" : "hover:bg-slate-50",
                        ].join(" ")}
                        onClick={() => setSelected(e)}
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
            {!selected ? (
              <div className="text-slate-600">Select an entry</div>
            ) : (
              <>
                <div className="text-sm text-slate-500">{formatDate(selected.entry_date)}</div>

                <div className="text-lg font-semibold text-slate-900">
                  Mood: {selected.mood}/5
                </div>

                {selected.prompt?.trim() ? (
                  <div className="text-sm text-slate-700">
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
          </Card>
        </div>
      )}
    </Page>
  );
}


