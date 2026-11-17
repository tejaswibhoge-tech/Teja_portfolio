import { useState } from 'react';
import { Check, Copy, ExternalLink, ShieldAlert } from 'lucide-react';

interface UploadGuideProps {
  repoUrl: string;
  pagesUrl: string;
  enabledPaths: string[];
}

export function UploadGuide({ repoUrl, pagesUrl, enabledPaths }: UploadGuideProps) {
  const [copiedGit, setCopiedGit] = useState(false);

  const gitCommands = `git clone ${repoUrl}.git
cd tejaswi-portfolio
# Unzip the downloaded python-portfolio-bundle.zip into this folder
git add ${enabledPaths.join(' ')}
git commit -m "Add Python portfolio generator and CS project modules"
git push origin main`;

  async function handleCopyGit() {
    try {
      await navigator.clipboard.writeText(gitCommands);
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 1800);
    } catch {
      // Ignore clipboard rejection
    }
  }

  return (
    <div className="space-y-6">
      {/* Security note regarding "I WILL GIVE ACCESS" */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-950 space-y-1">
          <p className="font-semibold">
            Keep your GitHub account private — no login or access needed
          </p>
          <p className="text-amber-900 leading-relaxed">
            Never share your GitHub password or Personal Access Token in chat.
            This workspace cannot push directly to your private GitHub session,
            so download the verified bundle above and upload it in under 60
            seconds using Option A or Option B below. Your live GitHub Pages site{' '}
            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-amber-700"
            >
              {pagesUrl}
            </a>{' '}
            keeps working seamlessly because <code className="font-mono text-xs">index.html</code>{' '}
            remains at the root.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option A: GitHub Web Upload */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Option A: Upload directly on GitHub.com
            </h3>
            <a
              href={`${repoUrl}/upload/main`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap shrink-0"
            >
              Open upload page
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <ol className="text-sm text-slate-600 space-y-2.5 list-decimal list-inside leading-relaxed">
            <li>
              Click <strong>Download .zip Bundle</strong> in the top bar and
              extract the folder on your computer.
            </li>
            <li>
              Open your repository on GitHub and choose{' '}
              <strong>Add file → Upload files</strong>.
            </li>
            <li>
              Drag all extracted files (including the{' '}
              <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                projects/
              </code>{' '}
              folder) onto the upload box.
            </li>
            <li>
              Commit directly to <code className="font-mono text-xs">main</code>.
              Refresh the repo page after 10 seconds to see the updated Python
              language bar.
            </li>
          </ol>
        </div>

        {/* Option B: Git CLI */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Option B: Push with Git CLI
            </h3>
            <button
              type="button"
              onClick={handleCopyGit}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedGit ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy commands
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto">
            <code>{gitCommands}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
