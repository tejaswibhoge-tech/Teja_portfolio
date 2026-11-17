import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import {
  GeneratedFile,
  INITIAL_GENERATED_FILES,
  INITIAL_REPO_SNAPSHOT,
  LANGUAGE_COLORS,
  RepoSnapshot,
  utf8ByteLength,
} from './data/pythonModules';
import { LanguageBar, LanguageEntry } from './components/LanguageBar';
import { CodeStudio } from './components/CodeStudio';
import { UploadGuide } from './components/UploadGuide';

function toLanguageEntries(
  languages: Record<string, number>,
): { entries: LanguageEntry[]; totalBytes: number } {
  const totalBytes = Object.values(languages).reduce((sum, n) => sum + n, 0);
  const entries = Object.entries(languages)
    .filter(([, bytes]) => bytes > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
      color: LANGUAGE_COLORS[name] ?? LANGUAGE_COLORS.Other,
    }));
  return { entries, totalBytes };
}

function parseRepoSlug(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }
  const slugMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (slugMatch) {
    return { owner: slugMatch[1], repo: slugMatch[2] };
  }
  return null;
}

export default function App() {
  const [repo, setRepo] = useState<RepoSnapshot>(INITIAL_REPO_SNAPSHOT);
  const [repoInput, setRepoInput] = useState(
    `${INITIAL_REPO_SNAPSHOT.owner}/${INITIAL_REPO_SNAPSHOT.repo}`,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [files, setFiles] = useState<GeneratedFile[]>(INITIAL_GENERATED_FILES);
  const [enabledIds, setEnabledIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INITIAL_GENERATED_FILES.map((f) => [f.id, f.defaultEnabled])),
  );
  const [activeFileId, setActiveFileId] = useState<string>(
    INITIAL_GENERATED_FILES[0].id,
  );
  const [isZipping, setIsZipping] = useState(false);

  const currentMetrics = useMemo(
    () => toLanguageEntries(repo.languages),
    [repo.languages],
  );

  const addedPythonBytes = useMemo(() => {
    return files.reduce((sum, file) => {
      if (!enabledIds[file.id] || !file.countedByLinguist) return sum;
      return sum + utf8ByteLength(file.content);
    }, 0);
  }, [files, enabledIds]);

  const projectedMetrics = useMemo(() => {
    const combined: Record<string, number> = { ...repo.languages };
    if (addedPythonBytes > 0) {
      combined.Python = (combined.Python ?? 0) + addedPythonBytes;
    }
    return toLanguageEntries(combined);
  }, [repo.languages, addedPythonBytes]);

  const projectedPythonPct = useMemo(() => {
    const py = projectedMetrics.entries.find((e) => e.name === 'Python');
    return py ? py.percentage : 0;
  }, [projectedMetrics]);

  const enabledPaths = useMemo(
    () => files.filter((f) => enabledIds[f.id]).map((f) => f.path),
    [files, enabledIds],
  );

  async function handleRefreshFromGitHub(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseRepoSlug(repoInput);
    if (!parsed) {
      setSyncError('Enter a valid GitHub URL or owner/repository name.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const [langRes, contentsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`),
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents`),
      ]);

      if (!langRes.ok) {
        throw new Error(`GitHub API returned status ${langRes.status}.`);
      }

      const languages = (await langRes.json()) as Record<string, number>;
      let existingFiles = repo.existingFiles;
      if (contentsRes.ok) {
        const rawContents = (await contentsRes.json()) as Array<{
          name: string;
          size: number;
          type: string;
        }>;
        if (Array.isArray(rawContents)) {
          existingFiles = rawContents.map((item) => {
            const lower = item.name.toLowerCase();
            const counted =
              lower.endsWith('.html') ||
              lower.endsWith('.js') ||
              lower.endsWith('.py') ||
              lower.endsWith('.ts');
            const language = lower.endsWith('.html')
              ? 'HTML'
              : lower.endsWith('.js')
                ? 'JavaScript'
                : lower.endsWith('.py')
                  ? 'Python'
                  : lower.endsWith('.css')
                    ? 'CSS (ignored by Linguist)'
                    : lower.endsWith('.pdf')
                      ? 'PDF (binary)'
                      : 'Other';
            return {
              name: item.name,
              bytes: item.size,
              countedByLinguist: counted,
              language,
            };
          });
        }
      }

      setRepo({
        owner: parsed.owner,
        repo: parsed.repo,
        branch: 'main',
        repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
        pagesUrl: `https://${parsed.owner}.github.io/${parsed.repo}/`,
        languages,
        existingFiles,
        lastSyncedLabel: `Synced at ${new Date().toLocaleTimeString()}`,
      });
    } catch (err) {
      setSyncError(
        err instanceof Error
          ? `${err.message} Showing cached repository snapshot.`
          : 'Could not reach GitHub API. Showing cached snapshot.',
      );
    } finally {
      setIsSyncing(false);
    }
  }

  function applyPreset(preset: 'balanced' | 'majority' | 'all') {
    if (preset === 'balanced') {
      setEnabledIds({
        generate_portfolio: true,
        ai_study_buddy: true,
        campus_navigator: false,
        test_portfolio: false,
        portfolio_data: true,
        requirements: true,
      });
    } else if (preset === 'majority') {
      setEnabledIds({
        generate_portfolio: true,
        ai_study_buddy: true,
        campus_navigator: true,
        test_portfolio: false,
        portfolio_data: true,
        requirements: true,
      });
    } else {
      setEnabledIds(Object.fromEntries(files.map((f) => [f.id, true])));
    }
  }

  function handleToggleFile(id: string) {
    setEnabledIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleChangeContent(id: string, nextContent: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content: nextContent } : f)),
    );
  }

  function handleResetFile(id: string) {
    const original = INITIAL_GENERATED_FILES.find((f) => f.id === id);
    if (!original) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content: original.content } : f)),
    );
  }

  function handleDownloadSingle(file: GeneratedFile) {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.path.split('/').pop() ?? file.path;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadZip() {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const file of files) {
        if (enabledIds[file.id]) {
          zip.file(file.path, file.content);
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${repo.repo}-python-bundle.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <a
            href="#overview"
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Portfolio Linguist Studio
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#overview"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#files"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Python Files
            </a>
            <a
              href="#math"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Linguist Math
            </a>
            <a
              href="#upload"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Upload Guide
            </a>
          </nav>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping || enabledPaths.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {isZipping ? 'Packaging...' : 'Download .zip Bundle'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-12">
        {/* Section 01: Overview & Live Repo Sync */}
        <section id="overview" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-indigo-600">
                {repo.owner}/{repo.repo} · {repo.lastSyncedLabel}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
                Shift your portfolio repository to {projectedPythonPct.toFixed(1)}% Python
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Your live portfolio site stays online at{' '}
                <a
                  href={repo.pagesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  tejaswibhoge-tech.github.io/tejaswi-portfolio
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>{' '}
                while genuine Python modules bring GitHub&apos;s repository language
                bar into the 40–50%+ range.
              </p>
            </div>

            <form
              onSubmit={handleRefreshFromGitHub}
              className="flex items-center gap-2 w-full lg:w-auto"
            >
              <label htmlFor="repo-input" className="sr-only">
                GitHub repository URL or slug
              </label>
              <input
                id="repo-input"
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repository"
                className="w-full lg:w-72 px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                />
                {isSyncing ? 'Syncing...' : 'Sync GitHub'}
              </button>
            </form>
          </div>

          {syncError && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              {syncError}
            </p>
          )}

          {/* Side-by-side Linguist comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LanguageBar
              title="Current GitHub Repository"
              subtitle="Live bytes detected by GitHub Linguist on main"
              entries={currentMetrics.entries}
              totalBytes={currentMetrics.totalBytes}
            />
            <LanguageBar
              title="Projected After Upload"
              subtitle={`Adding ${addedPythonBytes.toLocaleString()} bytes of Python code`}
              entries={projectedMetrics.entries}
              totalBytes={projectedMetrics.totalBytes}
              highlightPython
            />
          </div>
        </section>

        {/* Section 02: Python File Studio */}
        <section id="files" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                01. Generated Python Portfolio Modules
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Toggle modules or edit code live to hit your exact Python percentage.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              {(() => {
                const isBalanced =
                  enabledIds.generate_portfolio &&
                  enabledIds.ai_study_buddy &&
                  !enabledIds.campus_navigator &&
                  !enabledIds.test_portfolio;
                const isMajority =
                  enabledIds.generate_portfolio &&
                  enabledIds.ai_study_buddy &&
                  enabledIds.campus_navigator &&
                  !enabledIds.test_portfolio;
                const isAll = files.every((f) => enabledIds[f.id]);

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => applyPreset('balanced')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isBalanced
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      45–50% Target
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('majority')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isMajority
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      55%+ Majority
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isAll
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      All Modules
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          <CodeStudio
            files={files}
            enabledIds={enabledIds}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onToggleFile={handleToggleFile}
            onChangeContent={handleChangeContent}
            onResetFile={handleResetFile}
            onDownloadSingle={handleDownloadSingle}
          />
        </section>

        {/* Section 03: Why GitHub showed 95–100% HTML (Linguist Math) */}
        <section id="math" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              02. Exact File & Linguist Byte Breakdown
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              GitHub calculates language percentages strictly from non-ignored
              source code bytes on the default branch. CSS, Markdown, and PDFs
              are excluded by default.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Repository File</th>
                    <th className="py-3 px-5">Classification</th>
                    <th className="py-3 px-5">Linguist Status</th>
                    <th className="py-3 px-5 text-right">Size (Bytes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {repo.existingFiles.map((file) => (
                    <tr key={file.name} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-5 font-mono text-xs text-slate-900">
                        {file.name}
                      </td>
                      <td className="py-2.5 px-5 text-slate-600">{file.language}</td>
                      <td className="py-2.5 px-5 text-xs text-slate-500">
                        {file.countedByLinguist ? 'Counted in bar' : 'Excluded'}
                      </td>
                      <td className="py-2.5 px-5 font-mono text-xs text-slate-900 text-right tabular-nums">
                        {file.bytes.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {files
                    .filter((f) => enabledIds[f.id])
                    .map((file) => (
                      <tr key={file.id} className="bg-indigo-50/40 hover:bg-indigo-50/70">
                        <td className="py-2.5 px-5 font-mono text-xs font-medium text-indigo-900">
                          + {file.path}
                        </td>
                        <td className="py-2.5 px-5 text-indigo-800">{file.language}</td>
                        <td className="py-2.5 px-5 text-xs text-indigo-700">
                          {file.countedByLinguist
                            ? 'Added to Python bar'
                            : 'Data / spec (excluded)'}
                        </td>
                        <td className="py-2.5 px-5 font-mono text-xs font-medium text-indigo-950 text-right tabular-nums">
                          {utf8ByteLength(file.content).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 04: Upload Guide */}
        <section id="upload" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              03. Apply to Your GitHub Repository
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Add the generated Python files to{' '}
              <code className="font-mono text-xs">{repo.owner}/{repo.repo}</code>{' '}
              without affecting your live portfolio website.
            </p>
          </div>

          <UploadGuide
            repoUrl={repo.repoUrl}
            pagesUrl={repo.pagesUrl}
            enabledPaths={enabledPaths}
          />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            Tailored for {repo.owner}/{repo.repo}
          </span>
          <a
            href={repo.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            View repository on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
