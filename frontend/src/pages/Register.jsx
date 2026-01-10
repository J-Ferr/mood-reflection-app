import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function Register() {
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
      await axiosClient.post("/auth/register", {
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-slate-500 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur border border-slate-200/60 rounded-2xl p-6 shadow-xl shadow-black/10 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create account
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            A quiet place to start checking in with yourself.
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="input"
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
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <button
            className="btn btn-primary w-full rounded-xl"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="underline" to="/login">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
