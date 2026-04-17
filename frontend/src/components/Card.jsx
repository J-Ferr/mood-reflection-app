export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

