import { useEffect, useState } from "react";
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

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  async function loadStats() {
  try {
    const res = await axiosClient.get("/entries/stats");
    setStats(res.data);
  } catch (err) {
    // Stats should never block the dashboard
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

      if (loaded) {
        setEditMood(loaded.mood ?? 3);
        setEditNote(loaded.note ?? "");
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
      const res = await axiosClient.post("/entries", {
        mood,
        prompt,
        note,
      });

      setEntry(res.data.entry);
      setNote("");

      await loadStats();
    } catch (err) {
      if (err?.response?.status === 409) {
        await loadDashboard();
        return;
      }
      setError("Failed to submit today’s check-in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditing(true);
    setError("");

    try {
      const res = await axiosClient.patch("/entries/today", {
        mood: editMood,
        note: editNote,
      });

      setEntry(res.data.entry);
      setIsEditing(false);

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

  const mForEntry = entry ? MOODS.find((m) => m.value === entry.mood) : null;

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

          {entry ? (
            <Card className="space-y-4">
              <div>
                <div className={labelClass}>Your check-in</div>
                <div className="text-lg font-semibold">
                  {mForEntry?.emoji} {mForEntry?.label} ({entry.mood}/5)
                </div>
              </div>

              {!isEditing ? (
                <>
                  <div className="leading-relaxed whitespace-pre-wrap text-slate-800">
                    {entry.note || "No reflection."}
                  </div>

                  <div className="text-xs text-slate-400">
                    Saved for {formatDate(entry.entry_date)}
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm underline text-slate-700"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="textarea"
                  />

                  <button
                    disabled={editing}
                    className="btn btn-primary w-full sm:w-auto"
                  >
                    {editing ? "Saving..." : "Save"}
                  </button>
                </form>
              )}
            </Card>
          ) : (
            <Card className="space-y-4">
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((m) => (
                    <button
                      type="button"
                      key={m.value}
                      onClick={() => setMood(m.value)}
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
