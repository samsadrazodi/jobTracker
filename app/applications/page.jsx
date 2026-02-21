'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '../../lib/supabase/client'
import JobsTable from '../../components/JobsTable'
import AddJobForm from '../../components/AddJobForm'
import CSVImporter from '../../components/CSVImporter'
import Header from '../../components/Header'

const PAGE_SIZE = 20

const statusOptions = ['Applied', 'Phone Screen', 'Interview', 'Take Home', 'Final Round', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn']
const workTypeOptions = ['Remote', 'Hybrid', 'On-site']

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [workTypeFilter, setWorkTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

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

  const sourceOptions = useMemo(() => {
    const sources = [...new Set(jobs.map(j => j.source).filter(Boolean))]
    return sources.sort()
  }, [jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const searchLower = search.toLowerCase()
      const matchesSearch = !search ||
        job.company_name?.toLowerCase().includes(searchLower) ||
        job.job_title?.toLowerCase().includes(searchLower)
      const matchesStatus = !statusFilter || job.status === statusFilter
      const matchesWorkType = !workTypeFilter || job.work_type === workTypeFilter
      const matchesSource = !sourceFilter || job.source === sourceFilter
      return matchesSearch && matchesStatus && matchesWorkType && matchesSource
    })
  }, [jobs, search, statusFilter, workTypeFilter, sourceFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, workTypeFilter, sourceFilter])

  const hasActiveFilters = search || statusFilter || workTypeFilter || sourceFilter

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setWorkTypeFilter('')
    setSourceFilter('')
  }

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE)
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function goToPage(page) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectClass = `
    border border-gray-200 dark:border-gray-700
    rounded-lg px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-slate-400
    bg-white dark:bg-gray-800
    text-gray-700 dark:text-gray-300
  `

  return (
    <>
      
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Applications</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {loading ? 'Loading...' : (
                hasActiveFilters
                  ? `${filteredJobs.length} of ${jobs.length} application${jobs.length !== 1 ? 's' : ''}`
                  : `${jobs.length} application${jobs.length !== 1 ? 's' : ''} · Page ${currentPage} of ${Math.max(totalPages, 1)}`
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CSVImporter onImportComplete={fetchJobs} />
            <AddJobForm onJobAdded={fetchJobs} />
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search company or job title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>

          {/* Status */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Work Type */}
          <select value={workTypeFilter} onChange={e => setWorkTypeFilter(e.target.value)} className={selectClass}>
            <option value="">All Work Types</option>
            {workTypeOptions.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Source */}
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className={selectClass}>
            <option value="">All Sources</option>
            {sourceOptions.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* No results */}
        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-lg mb-2">No applications match your filters.</p>
            <button onClick={clearFilters} className="text-sm text-blue-500 hover:underline">Clear filters</button>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-20">Loading your applications...</p>
        ) : filteredJobs.length > 0 ? (
          <>
            <JobsTable jobs={paginatedJobs} onRefresh={fetchJobs} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...')
                    acc.push(page)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-gray-600">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => goToPage(item)}
                        className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                          currentPage === item
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : null}

      </main>
    </>
  )
}