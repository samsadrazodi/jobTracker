'use client'

import { useState } from 'react'
import { Download, Chrome, FolderOpen, ToggleRight, Puzzle, CheckCircle2, ExternalLink } from 'lucide-react'

const steps = [
  {
    icon: Download,
    title: 'Download the Extension',
    description: 'Click the button below to download the JobTracker extension as a ZIP file.',
    action: true,
  },
  {
    icon: FolderOpen,
    title: 'Unzip the File',
    description: 'Find the downloaded ZIP file and extract it to a folder on your computer. Remember where you save it!',
  },
  {
    icon: Chrome,
    title: 'Open Chrome Extensions',
    description: (
      <>
        In Chrome, navigate to{' '}
        <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">
          chrome://extensions
        </code>{' '}
        or go to Menu → More Tools → Extensions.
      </>
    ),
  },
  {
    icon: ToggleRight,
    title: 'Enable Developer Mode',
    description: 'In the top-right corner of the Extensions page, toggle on "Developer mode".',
  },
  {
    icon: FolderOpen,
    title: 'Load the Extension',
    description: 'Click "Load unpacked" and select the folder you extracted in Step 2.',
  },
  {
    icon: Puzzle,
    title: 'Pin to Toolbar',
    description: 'Click the puzzle piece icon in Chrome\'s toolbar, find JobTracker, and click the pin icon to keep it visible.',
  },
]

export default function InstallExtensionPage() {
  const [downloaded, setDownloaded] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(new Set())

  function toggleStep(i) {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <Puzzle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Install the Chrome Extension
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          The JobTracker extension lets you save job postings from LinkedIn, Dice, Indeed and more — with one click, directly into your tracker.
        </p>
      </div>

      {/* What you get */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">What the extension does</h2>
        <ul className="space-y-2">
          {[
            'Auto-fills job details (title, company, location, type) from job postings',
            'Works on LinkedIn, Dice, Indeed, and company career pages',
            'Opens a sidebar so you never leave the job posting',
            'Saves directly to your JobTracker account',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Installation Steps
        </h2>
        {steps.map((step, i) => {
          const Icon = step.icon
          const done = completedSteps.has(i)
          return (
            <div
              key={i}
              onClick={() => !step.action && toggleStep(i)}
              className={`flex gap-4 p-4 rounded-xl border transition-all ${
                step.action
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  : done
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
              }`}
            >
              {/* Step number / check */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                done
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                  <h3 className={`text-sm font-semibold ${done ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Download button inside step 1 */}
                {step.action && (
                  <a
                    href="/jobtracker-extension.zip"
                    download
                    onClick={() => { setDownloaded(true); toggleStep(i) }}
                    className="inline-flex items-center gap-2 mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Extension ZIP
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Done state */}
      {completedSteps.size >= steps.length && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-1">You're all set!</h3>
          <p className="text-sm text-green-700 dark:text-green-400 mb-4">
            The JobTracker extension is installed. Head to LinkedIn or any job board and click the extension icon to try it!
          </p>
          <a
            href="https://linkedin.com/jobs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-green-700 dark:text-green-400 hover:underline font-medium"
          >
            Try it on LinkedIn Jobs <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Troubleshooting */}
      <div className="mt-10 border-t border-gray-100 dark:border-gray-800 pt-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Troubleshooting
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "The extension icon doesn't appear",
              a: "Click the puzzle piece icon in Chrome's toolbar and pin JobTracker to make it always visible."
            },
            {
              q: "\"Load unpacked\" button is missing",
              a: "Make sure Developer Mode is toggled ON in the top-right corner of chrome://extensions."
            },
            {
              q: "Extension shows an error after loading",
              a: "Make sure you selected the extracted folder (not the ZIP file itself) when clicking Load unpacked."
            },
            {
              q: "Job details aren't auto-filling",
              a: "The extension works best on LinkedIn, Dice, and Indeed. On other sites, you may need to fill in details manually."
            },
          ].map(({ q, a }, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">{q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}