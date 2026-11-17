import { LANGUAGE_COLORS } from '../data/pythonModules';

export interface LanguageEntry {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

interface LanguageBarProps {
  title: string;
  subtitle: string;
  entries: LanguageEntry[];
  totalBytes: number;
  highlightPython?: boolean;
}

export function LanguageBar({
  title,
  subtitle,
  entries,
  totalBytes,
  highlightPython = false,
}: LanguageBarProps) {
  const pythonEntry = entries.find((e) => e.name === 'Python');
  const pythonPct = pythonEntry ? pythonEntry.percentage : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right font-mono tabular-nums">
          <span className="text-xs text-slate-500 block">Counted by Linguist</span>
          <span className="text-sm font-semibold text-slate-900">
            {totalBytes.toLocaleString()} bytes
          </span>
        </div>
      </div>

      {/* GitHub-style proportional bar */}
      <div
        className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100"
        role="img"
        aria-label={`${title}: ${entries.map((e) => `${e.name} ${e.percentage.toFixed(1)}%`).join(', ')}`}
      >
        {entries.map((entry, idx) => (
          <div
            key={entry.name}
            style={{
              width: `${Math.max(entry.percentage, 0.8)}%`,
              backgroundColor: entry.color || LANGUAGE_COLORS.Other,
            }}
            className={`h-full transition-all duration-200 ${
              idx > 0 ? 'border-l border-white/70' : ''
            }`}
            title={`${entry.name}: ${entry.percentage.toFixed(1)}% (${entry.bytes.toLocaleString()} bytes)`}
          />
        ))}
      </div>

      {/* Language breakdown legend */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {entries.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-b-0 sm:border-b-0"
          >
            <span className="flex items-center gap-2 text-slate-700 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums text-xs text-slate-600">
              <strong className="text-slate-900 font-semibold">
                {entry.percentage.toFixed(1)}%
              </strong>{' '}
              ({entry.bytes.toLocaleString()} B)
            </span>
          </div>
        ))}
      </div>

      {highlightPython && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">
            Target status (40–50%+ Python):
          </span>
          {pythonPct >= 40 ? (
            <span className="font-medium text-emerald-700">
              Target achieved · {pythonPct.toFixed(1)}% Python (ready for GitHub)
            </span>
          ) : (
            <span className="font-medium text-amber-700">
              Below target · {pythonPct.toFixed(1)}% Python (enable one more .py module)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
