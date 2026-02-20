'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import JobsTable from '../components/JobsTable'
import AddJobForm from '../components/AddJobForm'
import Header from '../components/Header'
import Dashboard from '../components/Dashboard'
import CSVImporter from '../components/CSVImporter'

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
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Tracker</h1>
            <p className="text-gray-500 mt-1">
              {loading ? 'Loading...' : `${jobs.length} application${jobs.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CSVImporter onImportComplete={fetchJobs} />
            <AddJobForm onJobAdded={fetchJobs} />
          </div>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading your applications...</p>
        ) : (
          <>
            <Dashboard jobs={jobs} />
            <JobsTable jobs={jobs} onRefresh={fetchJobs} />
          </>
        )}
      </main>
    </>
  )
}