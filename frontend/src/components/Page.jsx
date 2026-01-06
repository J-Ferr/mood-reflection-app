export default function Page({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-200 via-slate-50 to-slate-400 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
          {right}
        </div>

        {children}
      </div>
    </div>
  );
}
