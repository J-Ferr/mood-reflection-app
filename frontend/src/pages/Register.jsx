import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl border p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-slate-600">Registration form coming next.</p>

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
