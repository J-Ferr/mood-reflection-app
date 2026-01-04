import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl border p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="text-slate-600">Login form coming next.</p>

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
