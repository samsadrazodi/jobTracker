'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import AddJobForm from './AddJobForm'
import { createClient } from '../lib/supabase/client'
import { Bell } from 'lucide-react'

const statusColors = {
  'Applied':      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Phone Screen': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Interview':    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Take Home':    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Final Round':  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'Offer':        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Rejected':     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Ghosted':      'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  'Withdrawn':    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const workTypeBadge = {
  'Remote':  'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Hybrid':  'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'On-site': 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

const ACTIVE_STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Take Home', 'Final Round']

function isOverdueFollowUp(job) {
  if (!job.follow_up_date) return false
  if (!ACTIVE_STATUSES.includes(job.status)) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = job.follow_up_date.split('-').map(Number)
  const followUp = new Date(y, m - 1, d)
  return followUp <= today
}

function DetailRow({ label, value }) {
  if (!value && value !== false) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 dark:text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 font-medium">{value}</span>
    </div>
  )
}

function JobDetailPanel({ job, onClose, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const overdue = isOverdueFollowUp(job)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full sm:rounded-xl shadow-xl sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{job.company_name}</h2>
              {overdue && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full">
                  <Bell className="w-3 h-3" /> Follow-up overdue
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm truncate">{job.job_title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none ml-4 shrink-0">&times;</button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 dark:text-gray-500 w-36 shrink-0">Status</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[job.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
              {job.status}
            </span>
          </div>
          <DetailRow label="Date Applied" value={job.applied_date} />
          {job.follow_up_date && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 dark:text-gray-500 w-36 shrink-0">Follow Up Date</span>
              <span className={`font-medium ${overdue ? 'text-orange-500 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {job.follow_up_date}{overdue ? ' · Overdue' : ''}
              </span>
            </div>
          )}
          <DetailRow label="Source" value={job.source} />
          <DetailRow label="Apply Method" value={job.apply_method} />
          <DetailRow label="Location" value={job.location} />
          <DetailRow label="Work Type" value={job.work_type} />
          <DetailRow label="Job Type" value={job.job_type} />
          <DetailRow label="Resume Version" value={job.resume_version} />
          <DetailRow label="Cover Letter" value={job.cover_letter ? 'Yes' : 'No'} />
          {job.job_url && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 dark:text-gray-500 w-36 shrink-0">Job URL</span>
              <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                View Posting
              </a>
            </div>
          )}
          {job.notes && (
            <div className="flex flex-col gap-1 text-sm pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
              <span className="text-gray-400 dark:text-gray-500">Notes</span>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 sm:px-6 flex gap-3">
          <Button variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onEdit}>
            Edit
          </Button>
          {!confirming ? (
            <Button variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20" onClick={() => setConfirming(true)}>
              Delete
            </Button>
          ) : (
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onDelete}>
              Confirm Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Mobile card for a single job
function JobCard({ job, onClick }) {
  const overdue = isOverdueFollowUp(job)
  return (
    <div
      onClick={() => onClick(job)}
      className={`rounded-xl border p-4 cursor-pointer transition-all active:scale-[0.99] ${
        overdue
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 border-l-4 border-l-orange-500'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {overdue && <Bell className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
            <p className="font-semibold text-gray-900 dark:text-white truncate">{job.company_name}</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.job_title}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${statusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
          {job.status}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {job.applied_date && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{job.applied_date}</span>
        )}
        {job.work_type && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${workTypeBadge[job.work_type] || 'bg-gray-100 text-gray-600'}`}>
            {job.work_type}
          </span>
        )}
        {job.source && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{job.source}</span>
        )}
        {job.location && (
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{job.location}</span>
        )}
      </div>
    </div>
  )
}

export default function JobsTable({ jobs, onRefresh }) {
  const [selectedJob, setSelectedJob] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const supabase = createClient()

  async function handleDelete(job) {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', job.id)
    if (!error) {
      setSelectedJob(null)
      onRefresh()
    }
  }

  function handleEdit(job) {
    setSelectedJob(null)
    setEditingJob(job)
  }

  return (
    <>
      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden flex flex-col gap-3">
        {jobs.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-16">No applications yet. Add your first one!</p>
        ) : (
          jobs.map(job => (
            <JobCard key={job.id} job={job} onClick={setSelectedJob} />
          ))
        )}
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-gray-700 hover:bg-transparent">
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Company</TableHead>
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Job Title</TableHead>
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Status</TableHead>
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Date</TableHead>
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Source</TableHead>
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Work Type</TableHead>
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Location</TableHead>
              <TableHead className="py-2 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 dark:text-gray-500 py-10">
                  No applications yet. Add your first one!
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const overdue = isOverdueFollowUp(job)
                return (
                  <TableRow
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`cursor-pointer border-gray-100 dark:border-gray-700 transition-colors ${
                      overdue
                        ? 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200/80 dark:hover:bg-orange-900/50 border-l-4 border-l-orange-500'
                        : 'hover:bg-slate-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <TableCell className="py-2 px-3 font-semibold max-w-[160px] truncate text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        {overdue && <Bell className="w-3 h-3 text-orange-500 shrink-0" />}
                        {job.company_name}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3 max-w-[180px] truncate text-gray-700 dark:text-gray-300">{job.job_title}</TableCell>
                    <TableCell className="py-2 px-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[job.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {job.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{job.applied_date}</TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{job.source || '-'}</TableCell>
                    <TableCell className="py-2 px-3">
                      {job.work_type ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${workTypeBadge[job.work_type] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {job.work_type}
                        </span>
                      ) : <span className="text-gray-400 dark:text-gray-600">-</span>}
                    </TableCell>
                    <TableCell className="py-2 px-3 max-w-[120px] truncate text-gray-600 dark:text-gray-400">{job.location || '-'}</TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{job.job_type || '-'}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onEdit={() => handleEdit(selectedJob)}
          onDelete={() => handleDelete(selectedJob)}
        />
      )}

      {editingJob && (
        <AddJobForm
          editJob={editingJob}
          onJobAdded={() => { setEditingJob(null); onRefresh() }}
          onEditClose={() => setEditingJob(null)}
        />
      )}
    </>
  )
}