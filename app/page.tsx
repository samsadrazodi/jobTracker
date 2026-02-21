'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import Header from '../components/Header'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setJobs(data)
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
          <p className="text-gray-500 mt-1">
            {loading ? 'Loading...' : `${jobs.length} total application${jobs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading...</p>
        ) : (
          <Dashboard jobs={jobs} />
        )}
      </main>
    </>
  )
}