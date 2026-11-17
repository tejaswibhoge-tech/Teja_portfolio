import { useState } from 'react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
import { GeneratedFile, utf8ByteLength } from '../data/pythonModules';

interface CodeStudioProps {
  files: GeneratedFile[];
  enabledIds: Record<string, boolean>;
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onToggleFile: (id: string) => void;
  onChangeContent: (id: string, nextContent: string) => void;
  onResetFile: (id: string) => void;
  onDownloadSingle: (file: GeneratedFile) => void;
}

export function CodeStudio({
  files,
  enabledIds,
  activeFileId,
  onSelectFile,
  onToggleFile,
  onChangeContent,
  onResetFile,
  onDownloadSingle,
}: CodeStudioProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];
  const activeBytes = utf8ByteLength(activeFile.content);
  const lineCount = activeFile.content.split('\n').length;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedId(activeFile.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard fallback not needed if permission blocked
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left file selector & module toggles */}
        <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Files to Add to Repository
            </h3>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {Object.values(enabledIds).filter(Boolean).length}/{files.length} active
            </span>
          </div>

          <div className="space-y-2">
            {files.map((file) => {
              const isSelected = file.id === activeFile.id;
              const isEnabled = Boolean(enabledIds[file.id]);
              const bytes = utf8ByteLength(file.content);

              return (
                <div
                  key={file.id}
                  className={`rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-white border-indigo-300 shadow-xs'
                      : 'bg-white/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => onToggleFile(file.id)}
                      aria-label={`Include ${file.path} in bundle`}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => onSelectFile(file.id)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-slate-900 truncate">
                          {file.path}
                        </span>
                        <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
                          {bytes.toLocaleString()} B
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {file.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {file.language} ·{' '}
                        {file.countedByLinguist
                          ? 'Counted by GitHub Linguist'
                          : 'Config / data (not counted)'}
                      </p>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right code editor & live byte counter */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono font-semibold text-slate-900 truncate">
                  {activeFile.path}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                  {activeBytes.toLocaleString()} bytes · {lineCount} lines
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeFile.summary}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onResetFile(activeFile.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedId === activeFile.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy code
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onDownloadSingle(activeFile)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download file
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 text-slate-100 p-4">
            <label htmlFor="code-editor" className="sr-only">
              Edit {activeFile.path}
            </label>
            <textarea
              id="code-editor"
              value={activeFile.content}
              onChange={(e) => onChangeContent(activeFile.id, e.target.value)}
              spellCheck={false}
              className="w-full h-[420px] bg-transparent font-mono text-xs leading-6 text-slate-100 focus:outline-none resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
