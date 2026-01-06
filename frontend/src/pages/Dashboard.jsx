import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";

const MOODS = [
  { value: 1, emoji: "😣", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

const labelClass = "text-xs uppercase tracking-wide text-slate-500";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState("");

  // Create
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editMood, setEditMood] = useState(3);
  const [editNote, setEditNote] = useState("");
  const [editing, setEditing] = useState(false);

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [promptRes, entryRes] = await Promise.all([
        axiosClient.get("/prompts/today"),
        axiosClient.get("/entries/today"),
      ]);

      setPrompt(promptRes.data?.prompt || "");

      const loadedEntry = entryRes.data?.entry || null;
      setEntry(loadedEntry);

      if (loadedEntry) {
        setEditMood(loadedEntry.mood ?? 3);
        setEditNote(loadedEntry.note ?? "");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load dashboard.";
      setError(msg);

      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEntry(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await axiosClient.post("/entries", {
        mood,
        prompt,
        note,
      });

      setEntry(res.data.entry);
      setNote("");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        await loadDashboard();
        return;
      }

      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit today’s check-in.";
      setError(msg);

      if (status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit() {
    if (!entry) return;
    setEditMood(entry.mood ?? 3);
    setEditNote(entry.note ?? "");
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    if (entry) {
      setEditMood(entry.mood ?? 3);
      setEditNote(entry.note ?? "");
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setError("");
    setEditing(true);

    try {
      const res = await axiosClient.patch("/entries/today", {
        mood: editMood,
        note: editNote,
      });

      setEntry(res.data.entry);
      setIsEditing(false);
    } catch (err) {
      const status = err?.response?.status;

      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update today’s check-in.";
      setError(msg);

      if (status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setEditing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chipBase =
    "px-4 py-2 rounded-full border text-sm transition flex items-center gap-2 " +
    "hover:shadow-sm hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]";

  const mForEntry = entry ? MOODS.find((x) => x.value === entry.mood) : null;

  return (
    <Page
      title="Dashboard"
      subtitle="Daily check-in for your mood and reflection."
      right={
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm active:scale-[0.98]"
        >
          Log out
        </button>
      }
    >
      <Nav />

      {loading && (
        <Card>
          <p className="text-slate-600 leading-relaxed">
            Loading today’s check-in…
          </p>
        </Card>
      )}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50/80 space-y-2">
          <div className="font-medium text-red-800">Something went wrong</div>
          <div className="text-sm text-red-700 leading-relaxed">{error}</div>
          <button
            onClick={loadDashboard}
            className="mt-2 text-sm px-3 py-2 rounded-full bg-red-700 text-white hover:opacity-90 transition active:scale-[0.98]"
          >
            Try again
          </button>
        </Card>
      )}

      {!loading && !error && (
        <>
          <Card className="space-y-3">
            <div className={labelClass}>Today’s prompt</div>
            <div className="text-lg font-medium leading-snug text-slate-900">
              {prompt || "No prompt found."}
            </div>
          </Card>

          {entry ? (
            <Card className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className={labelClass}>Your check-in</div>
                  <div className="text-lg font-semibold text-slate-900 leading-snug">
                    {mForEntry ? `${mForEntry.emoji} ${mForEntry.label}` : "Mood"}
                    <span className="text-slate-500 font-normal">
                      {" "}
                      ({entry.mood}/5)
                    </span>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={startEdit}
                    className="text-sm px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm active:scale-[0.98]"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={cancelEdit}
                    type="button"
                    disabled={editing}
                    className="text-sm px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-60 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-2">
                  <div className={labelClass}>Reflection</div>
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-900">
                    {entry.note || (
                      <span className="text-slate-400">No note.</span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400">
                    Saved for {entry.entry_date}
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSaveEdit}>
                  <div className="space-y-2">
                    <div className={labelClass}>Mood</div>
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map((m) => (
                        <button
                          type="button"
                          key={m.value}
                          onClick={() => setEditMood(m.value)}
                          className={
                            chipBase +
                            " " +
                            (editMood === m.value
                              ? "bg-slate-900 text-indigo-200 border-slate-900 font-semibold"
                              : "bg-white hover:bg-slate-50 border-slate-200")
                          }
                          title={m.label}
                        >
                          <span className="text-base">{m.emoji}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className={labelClass}>Reflection</div>
                    <textarea
                      className="w-full min-h-30 border border-slate-200 rounded-2xl p-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-200 leading-relaxed"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Update your reflection…"
                    />
                  </div>

                  <button
                    disabled={editing}
                    className="w-full px-4 py-2 rounded-full bg-slate-900 text-indigo-200 hover:opacity-95 transition shadow-sm disabled:opacity-60 active:scale-[0.98]"
                  >
                    {editing ? "Saving…" : "Save changes"}
                  </button>
                </form>
              )}
            </Card>
          ) : (
            <Card className="space-y-4">
              <div className="space-y-2">
                <div className="text-lg font-semibold text-slate-900 leading-snug">
                  Today’s check-in
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pick a mood and write a quick reflection.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleCreateEntry}>
                <div className="space-y-2">
                  <div className={labelClass}>Mood</div>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        type="button"
                        key={m.value}
                        onClick={() => setMood(m.value)}
                        className={
                          chipBase +
                          " " +
                          (mood === m.value
                            ? "bg-slate-900 text-indigo-200 border-slate-900 font-semibold"
                            : "bg-white hover:bg-slate-50 border-slate-200")
                        }
                        title={m.label}
                      >
                        <span className="text-base">{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={labelClass}>Reflection (optional)</div>
                  <textarea
                    className="w-full min-h-30 border border-slate-200 rounded-2xl p-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-200 leading-relaxed"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write a few sentences…"
                  />
                </div>

                <button
                  disabled={submitting}
                  className="w-full px-4 py-2 rounded-full bg-slate-900 text-indigo-200 hover:opacity-95 transition shadow-sm disabled:opacity-60 active:scale-[0.98]"
                >
                  {submitting ? "Saving…" : "Submit today’s check-in"}
                </button>
              </form>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
