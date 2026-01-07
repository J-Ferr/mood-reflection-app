import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { setToken } from "../auth/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      setToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-100 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur border border-slate-200/60 rounded-2xl p-6 shadow-lg shadow-slate-900/5 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            A quiet space to check in with yourself.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          <button
            className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white hover:opacity-90 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="text-sm text-slate-600">
          No account?{" "}
          <Link className="underline" to="/register">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
