import { Link } from "react-router-dom";

export default function History() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-slate-600">Your past entries will show here.</p>

        <Link className="underline text-sm" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
