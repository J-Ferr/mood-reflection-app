import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../auth/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
          >
            Log out
          </button>
        </div>

        <p className="text-slate-600">Today’s check-in will live here.</p>

        <div className="flex gap-3 text-sm">
          <Link className="underline" to="/history">
            View history
          </Link>
        </div>
      </div>
    </div>
  );
}

