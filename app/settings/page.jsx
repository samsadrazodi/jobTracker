'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

function ImportHistory() {
  const [imports, setImports] = useState([])
  const [loading, setLoading] = useState(true)
  const [undoing, setUndoing] = useState(null)
  const [message, setMessage] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    loadImports()
  }, [])

  async function loadImports() {
    const { data, error } = await supabase
      .from('applications')
      .select('imported_at')
      .not('imported_at', 'is', null)
      .order('imported_at', { ascending: false })

    if (!error && data) {
      const grouped = data.reduce((acc, row) => {
        const key = row.imported_at
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      const importList = Object.entries(grouped)
        .map(([timestamp, count]) => ({ timestamp, count }))
        .slice(0, 5)

      setImports(importList)
    }
    setLoading(false)
  }

  async function handleUndo(timestamp) {
    setUndoing(timestamp)
    setMessage(null)

    const { error, count } = await supabase
      .from('applications')
      .delete({ count: 'exact' })
      .eq('imported_at', timestamp)

    setUndoing(null)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: `Removed ${count} imported applications.` })
      loadImports()
    }
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <p className="text-sm text-gray-400">Loading import history...</p>
  if (imports.length === 0) return <p className="text-sm text-gray-400">No CSV imports found.</p>

  return (
    <div className="flex flex-col gap-3">
      {message && (
        <p className={`text-sm px-3 py-2 rounded-md border ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-500'
        }`}>
          {message.text}
        </p>
      )}
      {imports.map(({ timestamp, count }) => (
        <div key={timestamp} className="flex items-center justify-between border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatDate(timestamp)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{count} application{count !== 1 ? 's' : ''} imported</p>
          </div>
          <button
            onClick={() => handleUndo(timestamp)}
            disabled={undoing === timestamp}
            className="text-sm text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 px-3 py-1.5 rounded-md transition-colors"
          >
            {undoing === timestamp ? 'Undoing...' : 'Undo Import'}
          </button>
        </div>
      ))}
    </div>
  )
}

function ResumeManager() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [message, setMessage] = useState(null)
  const [versionName, setVersionName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    loadResumes()
  }, [])

  function getDefaultVersionName() {
    return new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  async function loadResumes() {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setResumes(data)
    setLoading(false)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    // Auto-fill version name with date if empty
    if (!versionName) {
      setVersionName(getDefaultVersionName())
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = selectedFile.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year

      // Save record to resumes table
      const { error: dbError } = await supabase
        .from('resumes')
        .insert([{
          user_id: user.id,
          version_name: versionName || getDefaultVersionName(),
          file_name: selectedFile.name,
          file_url: urlData.signedUrl,
          file_path: filePath,
        }])

      if (dbError) throw dbError

      setMessage({ type: 'success', text: 'Resume uploaded successfully!' })
      setSelectedFile(null)
      setVersionName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadResumes()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }

    setUploading(false)
  }

  async function handleDelete(resume) {
    setDeleting(resume.id)
    setMessage(null)

    // Delete from storage
    await supabase.storage.from('resumes').remove([resume.file_path])

    // Delete from DB
    const { error } = await supabase.from('resumes').delete().eq('id', resume.id)

    setDeleting(null)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Resume deleted.' })
      loadResumes()
    }
  }

  async function handleDownload(resume) {
    const { data } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resume.file_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function formatFileSize(bytes) {
    if (!bytes) return ''
    return bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      {message && (
        <p className={`text-sm px-3 py-2 rounded-md border mb-4 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-500'
        }`}>
          {message.text}
        </p>
      )}

      {/* Upload area */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-5 mb-5 bg-gray-50 dark:bg-gray-700/30">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload New Resume</p>

        <div className="flex flex-col gap-3">
          {/* File picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-3 file:py-1.5 file:px-3
                file:rounded-md file:border file:border-gray-200 dark:file:border-gray-600
                file:text-sm file:font-medium
                file:bg-white dark:file:bg-gray-700
                file:text-gray-700 dark:file:text-gray-300
                hover:file:bg-gray-50 dark:hover:file:bg-gray-600
                file:cursor-pointer"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, DOC, or DOCX</p>
          </div>

          {/* Version name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Version Name
            </label>
            <input
              type="text"
              value={versionName}
              onChange={e => setVersionName(e.target.value)}
              placeholder={getDefaultVersionName()}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              e.g. "v3-frontend", "Google tailored" — defaults to today's date
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="self-start"
          >
            {uploading ? 'Uploading...' : 'Upload Resume'}
          </Button>
        </div>
      </div>

      {/* Resume list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading resumes...</p>
      ) : resumes.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No resumes uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resumes.map(resume => (
            <div
              key={resume.id}
              className="flex items-center justify-between border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {resume.version_name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {resume.file_name} &middot; {formatDate(resume.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <button
                  onClick={() => handleDownload(resume)}
                  className="text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(resume)}
                  disabled={deleting === resume.id}
                  className="text-xs text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  {deleting === resume.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email)
    }
    getUser()
  }, [])

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg(null)
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordMsg('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== email) {
      setDeleteError('Email does not match. Please type your email exactly.')
      return
    }

    setDeleteLoading(true)

    const response = await fetch('/api/delete-account', { method: 'DELETE' })
    const data = await response.json()

    if (!response.ok) {
      setDeleteError(data.error || 'Failed to delete account.')
      setDeleteLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mb-4 inline-block"
        >
          Back to Tracker
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{email}</p>
      </div>

      {/* Resume Manager */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">My Resumes</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
          Upload and manage your resume versions. Download anytime.
        </p>
        <ResumeManager />
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          {passwordError && (
            <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md px-3 py-2">{passwordError}</p>
          )}
          {passwordMsg && (
            <p className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-md px-3 py-2">{passwordMsg}</p>
          )}
          <Button type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Import History */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Import History</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Undo a recent CSV import if you made a mistake.</p>
        <ImportHistory />
      </div>

      {/* Delete Account */}
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-xl p-6">
        <h2 className="text-lg font-bold text-red-600 mb-2">Delete Account</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This will permanently delete your account and all your job applications. This cannot be undone.
          To confirm, type your email address below.
        </p>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={deleteConfirm}
            onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(null) }}
            className={inputClass}
            placeholder={email}
          />
          {deleteError && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md px-3 py-2">{deleteError}</p>
          )}
          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading || deleteConfirm !== email}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md py-2.5 text-sm font-medium transition-colors"
          >
            {deleteLoading ? 'Deleting...' : 'Permanently Delete My Account'}
          </button>
        </div>
      </div>

    </div>
  )
}