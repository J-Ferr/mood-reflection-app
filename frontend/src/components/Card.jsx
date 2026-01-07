export default function Card({ children, className = "" }) {
  return (
    <div
      className={
        "bg-white/95 backdrop-blur " +
        "border border-slate-200/60 " +
        "rounded-2xl p-5 " +
        "shadow-lg shadow-slate-900/5 " +
        className
      }
    >
      {children}
    </div>
  );
}

