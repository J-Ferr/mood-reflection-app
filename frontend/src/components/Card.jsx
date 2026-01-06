export default function Card({ children, className = "" }) {
  return (
    <div
      className={
        "bg-white backdrop-blur border border-slate-200 rounded-2xl shadow-sm " +
        "p-5 " +
        className
      }
    >
      {children}
    </div>
  );
}
