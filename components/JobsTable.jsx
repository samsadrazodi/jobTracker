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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{job.company_name}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{job.job_title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none ml-4">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 dark:text-gray-500 w-36 shrink-0">Status</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[job.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
              {job.status}
            </span>
          </div>
          <DetailRow label="Date Applied" value={job.applied_date} />
          <DetailRow label="Follow Up Date" value={job.follow_up_date} />
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
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
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

        <div className="px-6 pb-6 flex gap-3">
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
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-x-auto">
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
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 border-gray-100 dark:border-gray-700 transition-colors"
                >
                  <TableCell className="py-2 px-3 font-semibold max-w-[160px] truncate text-gray-900 dark:text-white">{job.company_name}</TableCell>
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
              ))
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