import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState("");

  // Create (POST /entries)
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit (PATCH /entries/today)
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

      // Prefill edit fields when an entry exists
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
        // already submitted today → reload the entry from server
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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link className="text-sm underline" to="/history">
              History
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white border rounded-xl p-5">
            <p className="text-slate-600">Loading today’s check-in…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800">
            <div className="font-medium">Something went wrong</div>
            <div className="text-sm mt-1">{error}</div>
            <button
              onClick={loadDashboard}
              className="mt-3 text-sm px-3 py-2 rounded-lg bg-red-700 text-white hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="bg-white border rounded-xl p-5 space-y-2">
              <div className="text-sm text-slate-500">Today’s prompt</div>
              <div className="text-lg">{prompt || "No prompt found."}</div>
            </div>

            {entry ? (
              <div className="bg-white border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Your check-in</div>
                    <div className="font-medium">
                      Mood:{" "}
                      <span className="font-semibold">{entry.mood}</span>/5
                    </div>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={startEdit}
                      className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={cancelEdit}
                      type="button"
                      className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
                      disabled={editing}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <>
                    <div className="text-sm text-slate-500">Reflection</div>
                    <div className="whitespace-pre-wrap">
                      {entry.note || (
                        <span className="text-slate-400">No note.</span>
                      )}
                    </div>
                  </>
                ) : (
                  <form className="space-y-4" onSubmit={handleSaveEdit}>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-500">Mood (1–5)</div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => setEditMood(n)}
                            className={
                              "px-3 py-2 rounded-lg border text-sm " +
                              (editMood === n
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white hover:bg-slate-50")
                            }
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm text-slate-500">
                        Reflection
                      </label>
                      <textarea
                        className="w-full min-h-30 border rounded-lg p-3"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Update your reflection…"
                      />
                    </div>

                    <button
                      disabled={editing}
                      className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {editing ? "Saving…" : "Save changes"}
                    </button>
                  </form>
                )}

                <div className="text-xs text-slate-400">
                  Saved for {entry.entry_date}
                </div>
              </div>
            ) : (
              <div className="bg-white border rounded-xl p-5 space-y-4">
                <div>
                  <div className="font-medium">Today’s check-in</div>
                  <p className="text-sm text-slate-600">
                    Pick a mood and write a quick reflection.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleCreateEntry}>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-500">Mood (1–5)</div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setMood(n)}
                          className={
                            "px-3 py-2 rounded-lg border text-sm " +
                            (mood === n
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white hover:bg-slate-50")
                          }
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-slate-500">
                      Reflection (optional)
                    </label>
                    <textarea
                      className="w-full min-h-30 border rounded-lg p-3"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write a few sentences…"
                    />
                  </div>

                  <button
                    disabled={submitting}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Saving…" : "Submit today’s check-in"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
