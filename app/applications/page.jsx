'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import JobsTable from '../../components/JobsTable'
import AddJobForm from '../../components/AddJobForm'
import CSVImporter from '../../components/CSVImporter'
import Header from '../../components/Header'

const PAGE_SIZE = 20

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
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

  // Pagination logic
  const totalPages = Math.ceil(jobs.length / PAGE_SIZE)
  const paginatedJobs = jobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function goToPage(page) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-500 mt-1">
              {loading ? 'Loading...' : `${jobs.length} application${jobs.length !== 1 ? 's' : ''} · Page ${currentPage} of ${totalPages}`}
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
            <JobsTable jobs={paginatedJobs} onRefresh={fetchJobs} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  )
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push('...')
                    }
                    acc.push(page)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => goToPage(item)}
                        className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                          currentPage === item
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}