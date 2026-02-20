'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import JobsTable from '../components/JobsTable'
import AddJobForm from '../components/AddJobForm'

export default function Home() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchJobs() {
    // const { data: { user } } = await supabase.auth.getUser()
    // console.log('current user:', user)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })

    // console.log('data:', data)
    // console.log('error:', error)

    if (!error) setJobs(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Tracker</h1>
          <p className="text-gray-500 mt-1">
            {loading ? 'Loading...' : `${jobs.length} application${jobs.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <AddJobForm onJobAdded={fetchJobs} />
      </div>
      {loading ? (
        <p className="text-center text-gray-400 py-20">Loading your applications...</p>
      ) : (
        <JobsTable jobs={jobs} onRefresh={fetchJobs} />
      )}
    </main>
  )
}