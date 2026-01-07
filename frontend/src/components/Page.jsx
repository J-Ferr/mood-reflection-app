export default function Page({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-100 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {right}
        </div>

        {children}
      </div>
    </div>
  );
}


