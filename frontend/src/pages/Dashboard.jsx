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

      {loading && (
        <Card className="space-y-2 animate-pulse">
          <div className={labelClass}>Dashboard</div>
          <div className="text-lg font-semibold text-slate-900">
            Loading your check-in...
          </div>
          <div className="text-sm text-slate-600">
            Pulling today's prompt and reflection data.
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card className="space-y-3 border border-red-200 bg-red-50/70">
          <div className="text-xs uppercase tracking-wide text-red-600">
            Something went wrong
          </div>
          <div className="text-sm text-red-800">{error}</div>
          <button
            onClick={loadDashboard}
            className="btn btn-outline w-full sm:w-auto"
          >
            Try again
          </button>
        </Card>
      )}

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
            <>
              {/* Section header */}
              <div className="space-y-1 bg-white/40 backdrop-blur-sm rounded-xl p-4">
                <div className={labelClass}>Today’s check-in</div>
                <h2 className="text-lg font-semibold text-slate-900">
                  You’ve already checked in today
                </h2>
                <p className="text-sm text-slate-600">
                  You can review or update your reflection anytime today.
                </p>
              </div>

              <Card className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-base font-semibold flex items-center gap-2 text-slate-900">
                      <span className={`${justCompleted ? "lock-pop" : ""}`}>🔒</span>
                      <span>
                        {mForEntry?.emoji} {mForEntry?.label} ({entry.mood}/5)
                      </span>
                    </div>

                    <div className="text-sm text-slate-600">
                      {preview || "No reflection added yet."}
                    </div>

                    <div className="text-xs text-slate-400">
                      Saved for {formatDate(entry.entry_date)}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => setIsEntryExpanded((prev) => !prev)}
                    className="text-sm text-slate-500"
                  >
                    {isEntryExpanded ? "Hide full check-in" : "View full check-in"}
                  </button>
                </div>

                {/* Expanded content */}
                {isEntryExpanded && (
                  <div className="pt-2 space-y-4">
                    {!isEditing ? (
                      <>
                        {/* Mood */}
                        <div className="space-y-2">
                          <div className={labelClass}>Mood</div>
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                            {mForEntry?.emoji} {mForEntry?.label}
                          </span>
                        </div>

                        {/* Reflection */}
                        <div className="space-y-2">
                          <div className={labelClass}>Reflection</div>
                          <div className="leading-relaxed whitespace-pre-wrap text-slate-800">
                            {entry.note || "No reflection added yet."}
                          </div>
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setIsEntryExpanded(true);
                          }}
                          className="text-sm underline text-slate-700"
                        >
                          Edit today’s check-in
                        </button>
                      </>
                    ) : (
                      <form onSubmit={handleSaveEdit} className="space-y-4">
                        {/* Mood */}
                        <div className={labelClass}>Mood</div>
                        <div className="flex gap-2 flex-wrap">
                          {MOODS.map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => setEditMood(m.value)}
                              className={`btn ${
                                editMood === m.value ? "btn-primary" : "btn-outline"
                              }`}
                              disabled={editing}
                            >
                              {m.emoji} {m.label}
                            </button>
                          ))}
                        </div>

                        {/* Reflection */}
                        <div className={labelClass}>Reflection</div>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="textarea"
                          placeholder="Update your reflection..."
                          disabled={editing}
                        />

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={editing}
                          >
                            {editing ? "Saving changes..." : "Save changes"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setIsEditing(false)}
                            disabled={editing}
                          >
                            Cancel
                          </button>
                        </div>
                    </form>
                  )}
                </div>
              )}
            </Card>
          </>
        )}

          {/* If no entry exists: show form */}
          {!entry && (
            <Card className="space-y-5">
              <div className="space-y-1">
                <div className={labelClass}>Today’s check-in</div>
                <h2 className="text-lg font-semibold text-slate-900">
                  How are you feeling right now?
                </h2>
                <p className="text-sm text-slate-500">
                  Choose your mood and add a short reflection if you want to.
                </p>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className={labelClass}>Mood</div>
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

                <div className={labelClass}>Reflection</div>      
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
                  {submitting ? "Saving check-in..." : "Save today’s check-in"}
                </button>
              </form>
            </Card>
            
          )}
        </>
      )}
    </Page>
  );
}
