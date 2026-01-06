import { NavLink } from "react-router-dom";

const base =
  "text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50";
const active = "bg-slate-900 text-white border-slate-900 hover:bg-slate-900";

export default function Nav() {
  return (
    <div className="flex flex-wrap gap-2">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => (isActive ? `${base} ${active}` : base)}
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/history"
        className={({ isActive }) => (isActive ? `${base} ${active}` : base)}
      >
        History
      </NavLink>
      <NavLink
        to="/stats"
        className={({ isActive }) => (isActive ? `${base} ${active}` : base)}
      >
        Stats
      </NavLink>
    </div>
  );
}
