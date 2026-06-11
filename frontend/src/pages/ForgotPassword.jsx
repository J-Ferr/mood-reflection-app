import { useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axiosClient.post("/auth/forgot-password", {
        email,
      });

      setMessage(
        res.data.message || "Check your email for a reset link."
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Could not process request.";

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
            Forgot Password
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Enter your email address and we'll send you a password reset link.
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {message && <div className="alert-success">{message}</div>}

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

          <button
            className="btn btn-primary w-full rounded-xl"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-sm text-slate-600">
          Remembered your password?{" "}
          <Link className="underline" to="/login">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}