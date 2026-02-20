'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { Button } from '@/components/ui/button'

function parseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

function parseCoverLetter(value) {
  if (!value) return false
  return value.trim().toLowerCase() === 'yes'
}

function mapRow(row, userId) {
  return {
    user_id: userId,
    company_name: row['Company'] || null,
    job_title: row['Job Title'] || null,
    status: row['Status'] || 'Applied',
    applied_date: parseDate(row['Date Applied']),
    job_url: row['Posting Link'] || null,
    source: row['Source'] || null,
    apply_method: row['Apply Method'] || null,
    location: row['Location'] || null,
    work_type: row['Remote'] || null,
    job_type: row['Job Type'] || null,
    resume_version: row['Resume Version'] || null,
    cover_letter: parseCoverLetter(row['Cover Letter']),
    notes: row['Notes'] || null,
    follow_up_date: null,
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    // Handle commas inside quoted fields
    const values = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes
      } else if (line[i] === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += line[i]
      }
    }
    values.push(current.trim())

    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] || ''
      return obj
    }, {})
  })
}

export default function CSVImporter({ onImportComplete }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const supabase = createClient()

  function handleFileChange(e) {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setResult(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const rows = parseCSV(text)
      setPreview(rows.slice(0, 3)) // show first 3 rows as preview
    }
    reader.readAsText(selectedFile)
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      const rows = parseCSV(text)

      // Filter out rows with no company name
      const validRows = rows.filter(row => row['Company'] && row['Company'].trim() !== '')
const importTimestamp = new Date().toISOString()
const mapped = validRows.map(row => ({ ...mapRow(row, user.id), imported_at: importTimestamp }))
      // Insert in batches of 50
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < mapped.length; i += 50) {
        const batch = mapped.slice(i, i + 50)
        const { error } = await supabase.from('applications').insert(batch)
        if (error) {
          errorCount += batch.length
          console.error('Batch error:', error)
        } else {
          successCount += batch.length
        }
      }

      setLoading(false)
      setResult({ successCount, errorCount, total: validRows.length })
      if (successCount > 0) onImportComplete()
    }

    reader.readAsText(file)
  }

  function handleClose() {
    setOpen(false)
    setFile(null)
    setPreview([])
    setResult(null)
    setError(null)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        📥 Import from CSV
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Import from Google Sheets</h2>
                <p className="text-sm text-gray-400 mt-0.5">Upload your exported CSV file</p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 flex flex-col gap-5">

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 leading-relaxed">
                <strong>How to export from Google Sheets:</strong><br />
                File → Download → Comma Separated Values (.csv)
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Preview */}
              {preview.length > 0 && !result && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview (first 3 rows):
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500">Company</th>
                          <th className="text-left px-3 py-2 text-gray-500">Job Title</th>
                          <th className="text-left px-3 py-2 text-gray-500">Status</th>
                          <th className="text-left px-3 py-2 text-gray-500">Date Applied</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-2">{row['Company'] || '—'}</td>
                            <td className="px-3 py-2">{row['Job Title'] || '—'}</td>
                            <td className="px-3 py-2">{row['Status'] || '—'}</td>
                            <td className="px-3 py-2">{row['Date Applied'] || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className={`rounded-lg p-4 text-sm ${result.errorCount === 0 ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-yellow-50 border border-yellow-100 text-yellow-700'}`}>
                  {result.errorCount === 0 ? (
                    <p>✅ Successfully imported <strong>{result.successCount}</strong> job applications!</p>
                  ) : (
                    <p>⚠️ Imported <strong>{result.successCount}</strong> jobs. Failed: <strong>{result.errorCount}</strong>. Check console for details.</p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  {result ? 'Close' : 'Cancel'}
                </Button>
                {!result && (
                  <Button onClick={handleImport} disabled={!file || loading}>
                    {loading ? 'Importing...' : `Import Jobs`}
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}