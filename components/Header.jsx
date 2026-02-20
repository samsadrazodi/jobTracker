'use client'

import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Header() {
  const [email, setEmail] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email)
    }
    getUser()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-gray-900 tracking-tight">Job<span className="text-blue-600">Tracker</span></span>
        </div>

        {/* Right side */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
              {email ? email[0].toUpperCase() : '?'}
            </div>
            <span className="hidden sm:block">{email}</span>
            <span className="text-gray-400">▾</span>
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
                </div>
                <button
                  onClick={() => { setShowMenu(false); router.push('/settings') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ⚙️ Account Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  🚪 Sign Out
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  )
}