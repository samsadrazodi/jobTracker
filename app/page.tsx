'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import Header from '../components/Header'
import Dashboard from '../components/Dashboard'
import Link from 'next/link'
import { Bell, X } from 'lucide-react'

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function FollowUpBanner({ jobs }: { jobs: any[] }) {
  const [dismissed, setDismissed] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueJobs = jobs.filter(job => {
    if (!job.follow_up_date) return false
    const followUp = parseLocalDate(job.follow_up_date)
    const isOverdue = followUp <= today
    const isActive = ['Applied', 'Phone Screen', 'Interview', 'Take Home', 'Final Round'].includes(job.status)
    return isOverdue && isActive
  })

  if (overdueJobs.length === 0 || dismissed) return null

  const todayCount = overdueJobs.filter(job => {
    const followUp = parseLocalDate(job.follow_up_date)
    return followUp.getTime() === today.getTime()
  }).length

  const pastCount = overdueJobs.length - todayCount

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-800/40 rounded-full flex items-center justify-center">
          <Bell className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            {overdueJobs.length} application{overdueJobs.length !== 1 ? 's' : ''} need{overdueJobs.length === 1 ? 's' : ''} follow-up
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
            {todayCount > 0 && `${todayCount} due today`}
            {todayCount > 0 && pastCount > 0 && ' · '}
            {pastCount > 0 && `${pastCount} overdue`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/applications"
          className="text-xs font-medium text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-800/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          View Applications
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setJobs(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return (
    <>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Loading...' : `${jobs.length} total application${jobs.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {!loading && <FollowUpBanner jobs={jobs} />}

        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading...</p>
        ) : (
          <Dashboard jobs={jobs} />
        )}
      </main>
    </>
  )
}