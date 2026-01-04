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

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      // Run both requests at once
      const [promptRes, entryRes] = await Promise.all([
        axiosClient.get("/prompts/today"),
        axiosClient.get("/entries/today"),
      ]);

      setPrompt(promptRes.data?.prompt || "");
      setEntry(entryRes.data?.entry || null);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load dashboard.";
      setError(msg);

      // If token is invalid/expired, send them back to login
      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setLoading(false);
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
              <div className="bg-white border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Your check-in</div>
                    <div className="font-medium">
                      Mood: <span className="font-semibold">{entry.mood}</span>/5
                    </div>
                  </div>

                  <button
                    className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
                    disabled
                    title="Next: we’ll add edit mode"
                  >
                    Edit (next)
                  </button>
                </div>

                <div className="text-sm text-slate-500">Reflection</div>
                <div className="whitespace-pre-wrap">
                  {entry.note || <span className="text-slate-400">No note.</span>}
                </div>

                <div className="text-xs text-slate-400">
                  Saved for {entry.entry_date}
                </div>
              </div>
            ) : (
              <div className="bg-white border rounded-xl p-5 space-y-2">
                <div className="font-medium">You haven’t checked in yet.</div>
                <p className="text-slate-600 text-sm">
                  Next: we’ll add the mood + reflection form here.
                </p>
                <button
                  className="mt-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:opacity-90"
                  disabled
                  title="Next: we’ll enable this"
                >
                  Start today’s check-in (next)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}



