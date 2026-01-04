import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-600">Today’s check-in will live here.</p>

        <div className="flex gap-3 text-sm">
          <Link className="underline" to="/history">
            View history
          </Link>
          <Link className="underline" to="/login">
            Log out (later)
          </Link>
        </div>
      </div>
    </div>
  );
}
