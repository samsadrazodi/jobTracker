'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '../../lib/supabase/client'
import JobsTable from '../../components/JobsTable'
import AddJobForm from '../../components/AddJobForm'
import CSVImporter from '../../components/CSVImporter'
import { LayoutList, LayoutGrid, Calendar, Briefcase, Ghost, X, ChevronDown, ChevronUp, Undo2, SlidersHorizontal } from 'lucide-react'

const PAGE_SIZE = 20

const statusOptions = ['Applied', 'Phone Screen', 'Interview', 'Take Home', 'Final Round', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn']
const workTypeOptions = ['Remote', 'Hybrid', 'On-site']

const KANBAN_COLUMNS = [
  { status: 'Applied',      color: 'bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800' },
  { status: 'Phone Screen', color: 'bg-yellow-500', light: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
  { status: 'Interview',    color: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
  { status: 'Take Home',    color: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  { status: 'Final Round',  color: 'bg-pink-500',   light: 'bg-pink-50 dark:bg-pink-900/20',     border: 'border-pink-200 dark:border-pink-800' },
  { status: 'Offer',        color: 'bg-green-500',  light: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-800' },
  { status: 'Rejected',     color: 'bg-red-400',    light: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-800' },
  { status: 'Ghosted',      color: 'bg-gray-400',   light: 'bg-gray-50 dark:bg-gray-800',        border: 'border-gray-200 dark:border-gray-700' },
  { status: 'Withdrawn',    color: 'bg-gray-300',   light: 'bg-gray-50 dark:bg-gray-800',        border: 'border-gray-200 dark:border-gray-700' },
]

const workTypeBadge = {
  'Remote':  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Hybrid':  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'On-site': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const applied = parseLocalDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - applied) / (1000 * 60 * 60 * 24))
}

function GhostBanner({ jobs, onRefresh }) {
  const supabase = createClient()
  const [days, setDays] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(localStorage.getItem('ghostDays') || '21', 10)
    return 21
  })
  const [inputVal, setInputVal] = useState(String(days))
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [undoIds, setUndoIds] = useState(null)
  const [undoTimer, setUndoTimer] = useState(null)
  const [undoCountdown, setUndoCountdown] = useState(0)

  const candidates = useMemo(() => {
    return jobs.filter(job => {
      if (job.status !== 'Applied') return false
      const d = daysSince(job.applied_date)
      return d !== null && d >= days
    }).sort((a, b) => daysSince(b.applied_date) - daysSince(a.applied_date))
  }, [jobs, days])

  useEffect(() => {
    const toRevert = jobs.filter(job =>
      job.status === 'Ghosted' && job.auto_ghosted === true &&
      job.applied_date && daysSince(job.applied_date) < days
    )
    if (toRevert.length === 0) return
    supabase.from('applications').update({ status: 'Applied', auto_ghosted: false })
      .in('id', toRevert.map(j => j.id))
      .then(({ error }) => { if (!error) onRefresh() })
  }, [days])

  useEffect(() => {
    setSelected(new Set(candidates.map(j => j.id)))
  }, [candidates.length, days])

  function saveDays(val) {
    const n = Math.max(1, parseInt(val) || 21)
    setDays(n); setInputVal(String(n))
    localStorage.setItem('ghostDays', String(n))
    setDismissed(false)
  }

  function startUndoTimer(ids) {
    setUndoIds(ids); setUndoCountdown(10)
    const interval = setInterval(() => {
      setUndoCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setUndoIds(null); return 0 }
        return prev - 1
      })
    }, 1000)
    setUndoTimer(interval)
  }

  async function handleConfirm() {
    if (selected.size === 0) return
    setUpdating(true)
    const ids = [...selected]
    const { error } = await supabase.from('applications')
      .update({ status: 'Ghosted', auto_ghosted: true }).in('id', ids)
    if (!error) { await onRefresh(); setDismissed(true); startUndoTimer(ids) }
    else alert('Failed to update. Please try again.')
    setUpdating(false)
  }

  async function handleUndo() {
    if (!undoIds) return
    clearInterval(undoTimer)
    const { error } = await supabase.from('applications')
      .update({ status: 'Applied', auto_ghosted: false }).in('id', undoIds)
    if (!error) { await onRefresh(); setUndoIds(null); setDismissed(false) }
    else alert('Failed to undo. Please try again.')
  }

  function toggleSelect(id) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const UndoToast = () => undoIds ? (
    <div className="flex items-center gap-2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg">
      <span>{undoIds.length} marked as Ghosted</span>
      <button onClick={handleUndo} className="flex items-center gap-1 font-medium text-blue-300 hover:text-blue-200">
        <Undo2 className="w-3 h-3" /> Undo ({undoCountdown}s)
      </button>
    </div>
  ) : null

  if (dismissed || candidates.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Ghost className="w-3.5 h-3.5 shrink-0" />
          <span>Auto-ghost after</span>
          <input
            type="number" min={1} value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={() => saveDays(inputVal)}
            onKeyDown={e => e.key === 'Enter' && saveDays(inputVal)}
            className="w-12 text-center font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span>days</span>
          {candidates.length === 0 && <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">· no candidates</span>}
          {dismissed && candidates.length > 0 && (
            <button onClick={() => setDismissed(false)} className="text-gray-500 underline ml-1">
              Review {candidates.length}
            </button>
          )}
        </div>
        {undoIds && <div className="ml-auto"><UndoToast /></div>}
      </div>
    )
  }

  return (
    <>
      {undoIds && (
        <div className="flex justify-end mb-2"><UndoToast /></div>
      )}
      <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 sm:mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
              <Ghost className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {candidates.length} app{candidates.length !== 1 ? 's' : ''} may have ghosted you
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                Still "Applied" after
                <input
                  type="number" min={1} value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onBlur={() => saveDays(inputVal)}
                  onKeyDown={e => e.key === 'Enter' && saveDays(inputVal)}
                  className="w-12 text-center font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span className="hidden sm:inline">{expanded ? 'Hide' : 'Review'}</span>
            </button>
            <button onClick={handleConfirm} disabled={updating || selected.size === 0}
              className="text-xs font-medium bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
              {updating ? '...' : `Mark ${selected.size} Ghosted`}
            </button>
            <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {expanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col gap-2.5 max-h-56 overflow-y-auto">
            <p className="text-xs text-gray-400 dark:text-gray-500">Uncheck any to keep as "Applied"</p>
            {candidates.map(job => (
              <label key={job.id} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={selected.has(job.id)} onChange={() => toggleSelect(job.id)}
                  className="w-4 h-4 rounded accent-gray-600" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block truncate">{job.company_name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">{job.job_title}</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{daysSince(job.applied_date)}d ago</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function KanbanCard({ job, onClick, onDragStart, compact = false }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onClick={() => onClick(job)}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 transition-all select-none ${compact ? 'p-2' : 'p-3'}`}
    >
      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{job.company_name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.job_title}</p>
      {!compact && (
        <div className="flex flex-col gap-1 mt-2.5">
          {job.applied_date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Calendar className="w-3 h-3 shrink-0" />{job.applied_date}
            </div>
          )}
          {job.source && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Briefcase className="w-3 h-3 shrink-0" />{job.source}
            </div>
          )}
          {job.work_type && (
            <span className={`mt-1 self-start text-xs font-medium px-2 py-0.5 rounded-full ${workTypeBadge[job.work_type] || 'bg-gray-100 text-gray-500'}`}>
              {job.work_type}
            </span>
          )}
        </div>
      )}
      {compact && job.applied_date && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{job.applied_date}</p>
      )}
    </div>
  )
}

function KanbanBoard({ jobs, onRefresh }) {
  const [selectedJob, setSelectedJob] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [localJobs, setLocalJobs] = useState(jobs)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const dragJobRef = useRef(null)
  const supabase = createClient()

  useEffect(() => { setLocalJobs(jobs) }, [jobs])

  const jobsByStatus = useMemo(() => {
    const map = {}
    KANBAN_COLUMNS.forEach(col => { map[col.status] = [] })
    localJobs.forEach(job => { if (map[job.status]) map[job.status].push(job) })
    return map
  }, [localJobs])

  function handleDragStart(e, job) { dragJobRef.current = job; e.dataTransfer.effectAllowed = 'move' }
  function handleDragOver(e, status) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStatus(status) }
  function handleDragLeave() { setDragOverStatus(null) }

  async function handleDrop(e, newStatus) {
    e.preventDefault(); setDragOverStatus(null)
    const job = dragJobRef.current
    if (!job || job.status === newStatus) return
    setLocalJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j))
    const { error } = await supabase.from('applications')
      .update({ status: newStatus, auto_ghosted: false }).eq('id', job.id)
    if (error) {
      setLocalJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: job.status } : j))
      alert('Failed to update status.')
    } else { onRefresh() }
    dragJobRef.current = null
  }

  const KanbanColumn = ({ status, color, light, border, compact = false }) => {
    const colJobs = jobsByStatus[status] || []
    const isOver = dragOverStatus === status
    return (
      <div
        className={`flex flex-col flex-shrink-0 ${compact ? 'w-[160px]' : 'sm:w-auto'}`}
        onDragOver={(e) => handleDragOver(e, status)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className={`flex items-center justify-between px-2.5 py-2 rounded-t-lg border ${border} ${light}`}>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap truncate max-w-[90px]">{status}</span>
          </div>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded-full ml-1 shrink-0">
            {colJobs.length}
          </span>
        </div>
        <div
          className={`flex-1 rounded-b-lg border border-t-0 p-1.5 flex flex-col gap-1.5 overflow-y-auto transition-colors ${border} ${
            isOver ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500' : light
          }`}
          style={{ maxHeight: compact ? '55vh' : '420px', minHeight: '80px', overflowY: 'auto' }}
        >
          {colJobs.length === 0 ? (
            <div className={`flex-1 flex items-center justify-center rounded-lg border-2 border-dashed ${
              isOver ? 'border-blue-400' : 'border-transparent'
            }`}>
              <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                {isOver ? 'Drop here' : 'Empty'}
              </p>
            </div>
          ) : (
            <>
              {colJobs.map(job => (
                <KanbanCard key={job.id} job={job} onClick={setSelectedJob} onDragStart={handleDragStart} compact={compact} />
              ))}
              {isOver && <div className="h-1 rounded-full bg-blue-400 mx-1" />}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: horizontal scroll, compact cards, single row */}
      <div className="sm:hidden overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          {KANBAN_COLUMNS.map(col => <KanbanColumn key={col.status} {...col} compact={true} />)}
        </div>
      </div>

      {/* Tablet/Desktop: two rows of 5 columns each */}
      <div className="hidden sm:flex flex-col gap-4">
        {[KANBAN_COLUMNS.slice(0, 5), KANBAN_COLUMNS.slice(5)].map((rowCols, rowIdx) => (
          <div key={rowIdx} className="grid gap-3" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
            {rowCols.map(col => <KanbanColumn key={col.status} {...col} />)}
          </div>
        ))}
      </div>

      {/* Detail modal - slides up from bottom on mobile */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedJob(null)}>
          <div className="bg-white dark:bg-gray-800 w-full sm:rounded-xl shadow-xl sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{selectedJob.status}</p>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{selectedJob.company_name}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm truncate">{selectedJob.job_title}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none ml-4 shrink-0">&times;</button>
            </div>
            <div className="p-5 sm:p-6 flex flex-col gap-2.5 text-sm">
              {selectedJob.applied_date   && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Date Applied</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.applied_date}</span></div>}
              {selectedJob.source         && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Source</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.source}</span></div>}
              {selectedJob.work_type      && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Work Type</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.work_type}</span></div>}
              {selectedJob.job_type       && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Job Type</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.job_type}</span></div>}
              {selectedJob.location       && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Location</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.location}</span></div>}
              {selectedJob.apply_method   && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Apply Method</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.apply_method}</span></div>}
              {selectedJob.resume_version && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Resume</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.resume_version}</span></div>}
              {selectedJob.follow_up_date && <div className="flex gap-2"><span className="text-gray-400 w-32 shrink-0">Follow Up</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.follow_up_date}</span></div>}
              {selectedJob.job_url && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-32 shrink-0">Job URL</span>
                  <a href={selectedJob.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">View Posting</a>
                </div>
              )}
              {selectedJob.notes && (
                <div className="flex flex-col gap-1 pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
                  <span className="text-gray-400">Notes</span>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedJob.notes}</p>
                </div>
              )}
            </div>
            <div className="px-5 pb-6 sm:px-6">
              <button onClick={() => { setEditingJob(selectedJob); setSelectedJob(null) }}
                className="w-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg py-2.5 text-sm font-medium transition-colors">
                Edit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {editingJob && (
        <AddJobForm editJob={editingJob}
          onJobAdded={() => { setEditingJob(null); onRefresh() }}
          onEditClose={() => setEditingJob(null)} />
      )}
    </>
  )
}

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [view, setView] = useState('table')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [workTypeFilter, setWorkTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const supabase = createClient()

  async function fetchJobs() {
    const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
    if (!error) setJobs(data)
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [])

  const sourceOptions = useMemo(() => [...new Set(jobs.map(j => j.source).filter(Boolean))].sort(), [jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const s = search.toLowerCase()
      return (!search || job.company_name?.toLowerCase().includes(s) || job.job_title?.toLowerCase().includes(s)) &&
        (!statusFilter || job.status === statusFilter) &&
        (!workTypeFilter || job.work_type === workTypeFilter) &&
        (!sourceFilter || job.source === sourceFilter)
    })
  }, [jobs, search, statusFilter, workTypeFilter, sourceFilter])

  useEffect(() => { setCurrentPage(1) }, [search, statusFilter, workTypeFilter, sourceFilter])

  const hasActiveFilters = search || statusFilter || workTypeFilter || sourceFilter

  function clearFilters() { setSearch(''); setStatusFilter(''); setWorkTypeFilter(''); setSourceFilter('') }

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE)
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function goToPage(page) { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const selectClass = `w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300`

  const activeFilterCount = [statusFilter, workTypeFilter, sourceFilter].filter(Boolean).length

  return (
    <main className={view === 'kanban' ? 'px-4 sm:px-6 py-6 sm:py-10' : 'max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10'}>

      {/* Page Header */}
      <div className="mb-5 sm:mb-6">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Applications</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
              {loading ? 'Loading...' : hasActiveFilters
                ? `${filteredJobs.length} of ${jobs.length}`
                : view === 'table'
                ? `${jobs.length} total · Page ${currentPage}/${Math.max(totalPages, 1)}`
                : `${jobs.length} total`}
            </p>
          </div>
          {/* View toggle — always visible */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-medium transition-colors ${
                view === 'table' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-medium transition-colors ${
                view === 'kanban' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>
        </div>

        {/* Action buttons row — full width on mobile */}
        <div className="flex items-center gap-2">
          <div className="flex-1 sm:flex-none">
            <CSVImporter onImportComplete={fetchJobs} />
          </div>
          <div className="flex-1 sm:flex-none">
            <AddJobForm onJobAdded={fetchJobs} />
          </div>
        </div>
      </div>

      {/* Ghost Banner */}
      {!loading && <GhostBanner jobs={jobs} onRefresh={fetchJobs} />}



      {/* Search + Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6">
        {/* Search row — always visible */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Search company or job title..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>
          {/* Filter toggle button on mobile */}
          <button onClick={() => setFiltersOpen(f => !f)}
            className={`sm:hidden relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Clear on mobile when filters active */}
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="sm:hidden text-sm text-red-500 border border-red-200 dark:border-red-800 px-2.5 py-2 rounded-lg">
              ✕
            </button>
          )}
        </div>

        {/* Filter dropdowns — always visible on desktop, toggleable on mobile */}
        <div className={`${filtersOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-2 mt-3 flex-wrap`}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={workTypeFilter} onChange={e => setWorkTypeFilter(e.target.value)} className={selectClass}>
            <option value="">All Work Types</option>
            {workTypeOptions.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className={selectClass}>
            <option value="">All Sources</option>
            {sourceOptions.map(s => <option key={s}>{s}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="hidden sm:block text-sm text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg whitespace-nowrap">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {!loading && filteredJobs.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg mb-2">No applications match your filters.</p>
          <button onClick={clearFilters} className="text-sm text-blue-500 hover:underline">Clear filters</button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-20">Loading your applications...</p>
      ) : filteredJobs.length > 0 ? (
        view === 'kanban' ? (
          <KanbanBoard jobs={filteredJobs} onRefresh={fetchJobs} />
        ) : (
          <>
            <JobsTable jobs={paginatedJobs} onRefresh={fetchJobs} />
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...')
                    acc.push(page)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`e-${idx}`} className="px-1 text-gray-400">…</span>
                    ) : (
                      <button key={item} onClick={() => goToPage(item)}
                        className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                          currentPage === item
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        {item}
                      </button>
                    )
                  )}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
                  Next →
                </button>
              </div>
            )}
          </>
        )
      ) : null}

    </main>
  )
}