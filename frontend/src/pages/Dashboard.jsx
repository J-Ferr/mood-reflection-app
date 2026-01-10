import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";
import StatsCard from "../components/StatsCard";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";
import formatDate from "../utils/formatDate";

const MOODS = [
  { value: 1, emoji: "😣", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

const labelClass = "text-xs uppercase tracking-wide text-slate-500";

function makePreview(text, max = 70) {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState("");

  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editMood, setEditMood] = useState(3);
  const [editNote, setEditNote] = useState("");
  const [editing, setEditing] = useState(false);

  const [stats, setStats] = useState(null);

  // Collapsible "today's check-in" card state
  const [isEntryExpanded, setIsEntryExpanded] = useState(false);

  // Tiny lock pop animation trigger
  const [justCompleted, setJustCompleted] = useState(false);
  const triggerCompletedAnim = () => {
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 350);
  };

  const hasEntry = !!entry;

  const mForEntry = useMemo(() => {
    return entry ? MOODS.find((m) => m.value === entry.mood) : null;
  }, [entry]);

  const preview = useMemo(() => {
    return makePreview(entry?.note, 78);
  }, [entry]);

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  async function loadStats() {
    try {
      const res = await axiosClient.get("/entries/stats");
      setStats(res.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login");
      } else {
        console.error("Failed to load stats", err);
      }
    }
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
      const loaded = entryRes.data?.entry || null;
      setEntry(loaded);

      // Always start collapsed when loading an existing entry
      setIsEntryExpanded(false);

      if (loaded) {
        setEditMood(loaded.mood ?? 3);
        setEditNote(loaded.note ?? "");
      } else {
        setMood(3);
        setNote("");
        setIsEditing(false);
      }

      await loadStats();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load dashboard.");
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
    setSubmitting(true);
    setError("");

    try {
      const cleanedNote =
        typeof note === "string" && note.trim().length ? note.trim() : null;

      const res = await axiosClient.post("/entries", {
        mood,
        prompt,
        note: cleanedNote,
      });

      setEntry(res.data.entry);

      // After submit: hide form, show compact completed tile (collapsed)
      setIsEntryExpanded(false);
      setIsEditing(false);
      setNote("");

      triggerCompletedAnim();
      await loadStats();
    } catch (err) {
      if (err?.response?.status === 409) {
        await loadDashboard();
        return;
      }
      setError("Failed to submit today’s check-in.");
      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditing(true);
    setError("");

    try {
      const cleanedEditNote =
        typeof editNote === "string" && editNote.trim().length
          ? editNote.trim()
          : null;

      const res = await axiosClient.patch("/entries/today", {
        mood: editMood,
        note: cleanedEditNote,
      });

      setEntry(res.data.entry);
      setIsEditing(false);
      setIsEntryExpanded(true); // keep open after saving edits
      triggerCompletedAnim();
      await loadStats();
    } catch (err) {
      setError("Failed to update entry.");
      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setEditing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <Page
      title="Dashboard"
      subtitle="Daily check-in for your mood and reflection."
      right={
        <button onClick={handleLogout} className="btn btn-outline text-sm">
          Log out
        </button>
      }
    >
      <Nav />

      {loading && <Card>Loading…</Card>}

      {!loading && error && <Card className="space-y-3">{error}</Card>}

      {!loading && !error && (
        <>
          <Card className="space-y-3">
            <div className={labelClass}>Today’s prompt</div>
            <div className="text-lg leading-relaxed">{prompt}</div>
          </Card>

          {/* streak + insight */}
          <div className="pt-2">
            <div className="h-px w-full bg-slate-200/60 mb-4" />
            <StatsCard stats={stats} />
          </div>

          {/* If entry exists: show compact collapsible "Today's check-in" tile */}
          {entry && (
            <Card className="space-y-3">
              {/* Header row (always visible) */}
              <button
                type="button"
                onClick={() => setIsEntryExpanded((v) => !v)}
                className="w-full text-left rounded-lg transition-colors hover:bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-slate-200"
                aria-expanded={isEntryExpanded}
              >
                <div className="flex items-start justify-between gap-4 p-2 -m-2">
                  <div className="space-y-1">
                    <div className={labelClass}>Today’s check-in</div>

                    <div className="text-base font-semibold flex items-center gap-2">
                      <span className={`${justCompleted ? "lock-pop" : ""}`}>
                        🔒
                      </span>
                      <span>
                        {mForEntry?.emoji} {mForEntry?.label} ({entry.mood}/5)
                      </span>
                    </div>

                    {/* Preview (one line) */}
                    <div className="text-sm text-slate-600">
                      {preview || "No reflection."}
                    </div>

                    <div className="text-xs text-slate-400">
                      Saved for {formatDate(entry.entry_date)}
                    </div>
                  </div>

                  <div className="text-sm text-slate-500 pt-1">
                    {isEntryExpanded ? "Hide" : "View"}
                  </div>
                </div>
              </button>

              {/* Collapsible content */}
              <div
                className={`transition-all duration-300 ease-out overflow-hidden ${
                  isEntryExpanded
                    ? "max-h-175 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="pt-2 space-y-3">
                  {!isEditing ? (
                    <>
                      <div>
                        <div className={labelClass}>Full reflection</div>
                        <div className="leading-relaxed whitespace-pre-wrap text-slate-800">
                          {entry.note || "No reflection."}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setIsEntryExpanded(true);
                        }}
                        className="text-sm underline text-slate-700"
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        {MOODS.map((m) => (
                          <button
                            type="button"
                            key={m.value}
                            onClick={() => setEditMood(m.value)}
                            disabled={editing}
                            className={`btn btn-outline px-3 py-2 text-sm ${
                              editMood === m.value
                                ? "bg-slate-900 text-white border-slate-900"
                                : ""
                            }`}
                          >
                            {m.emoji} {m.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="textarea"
                        disabled={editing}
                      />

                      <div className="flex gap-2">
                        <button
                          disabled={editing}
                          className="btn btn-primary w-full sm:w-auto"
                        >
                          {editing ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          disabled={editing}
                          onClick={() => {
                            setIsEditing(false);
                            // reset edits to current entry values
                            setEditMood(entry.mood ?? 3);
                            setEditNote(entry.note ?? "");
                          }}
                          className="btn btn-outline w-full sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* If no entry exists: show form */}
          {!entry && (
            <Card className="space-y-4">
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((m) => (
                    <button
                      type="button"
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      disabled={submitting}
                      className={`btn btn-outline px-3 py-2 text-sm ${
                        mood === m.value
                          ? "bg-slate-900 text-white border-slate-900"
                          : ""
                      }`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="textarea"
                  placeholder="Write a few words about what’s on your mind…"
                  disabled={submitting}
                />

                <button
                  disabled={submitting}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
