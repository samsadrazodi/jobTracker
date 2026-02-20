'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

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

    // Delete all user's applications first
    await supabase.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Sign out and redirect
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const inputClass = "w-full border border-gray-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block"
        >
          ← Back to Tracker
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">{email}</p>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Change Password</h2>
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
            <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-md px-3 py-2">{passwordError}</p>
          )}
          {passwordMsg && (
            <p className="text-green-600 text-sm bg-green-50 border border-green-100 rounded-md px-3 py-2">{passwordMsg}</p>
          )}

          <Button type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-red-600 mb-2">Delete Account</h2>
        <p className="text-sm text-gray-500 mb-4">
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
            <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-md px-3 py-2">{deleteError}</p>
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