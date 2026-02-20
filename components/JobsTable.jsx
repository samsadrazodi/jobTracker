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
import { createClient } from '../lib/supabase/client'
import AddJobForm from './AddJobForm'

const statusColors = {
  'Applied':        'bg-blue-100 text-blue-700',
  'Phone Screen':   'bg-yellow-100 text-yellow-700',
  'Interview':      'bg-purple-100 text-purple-700',
  'Take Home':      'bg-orange-100 text-orange-700',
  'Final Round':    'bg-pink-100 text-pink-700',
  'Offer':          'bg-green-100 text-green-700',
  'Rejected':       'bg-red-100 text-red-700',
  'Ghosted':        'bg-gray-100 text-gray-500',
  'Withdrawn':      'bg-gray-100 text-gray-500',
}

function DetailRow({ label, value }) {
  if (!value && value !== false) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

function JobDetailPanel({ job, onClose, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{job.company_name}</h2>
            <p className="text-gray-500 mt-0.5">{job.job_title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <DetailRow label="Status" value={
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
              {job.status}
            </span>
          } />
          <DetailRow label="Date Applied" value={job.applied_date} />
          <DetailRow label="Follow Up Date" value={job.follow_up_date} />
          <DetailRow label="Source" value={job.source} />
          <DetailRow label="Apply Method" value={job.apply_method} />
          <DetailRow label="Location" value={job.location} />
          <DetailRow label="Job Type" value={job.job_type} />
          <DetailRow label="Resume Version" value={job.resume_version} />
          <DetailRow label="Cover Letter" value={job.cover_letter ? '✅ Yes' : '❌ No'} />
          {job.job_url && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 w-36 shrink-0">Job URL</span>
              <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                View Posting ↗
              </a>
            </div>
          )}
          {job.notes && (
            <div className="flex flex-col gap-1 text-sm pt-2 border-t mt-1">
              <span className="text-gray-400">Notes</span>
              <p className="text-gray-800 whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            ✏️ Edit
          </Button>
          {!confirming ? (
            <Button variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50" onClick={() => setConfirming(true)}>
              🗑 Delete
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
  const supabase = createClient()
  const [selectedJob, setSelectedJob] = useState(null)
  const [editingJob, setEditingJob] = useState(null)

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
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-10">
                  No applications yet. Add your first one!
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="font-semibold">{job.company_name}</TableCell>
                  <TableCell>{job.job_title}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell>{job.applied_date}</TableCell>
                  <TableCell>{job.source || '—'}</TableCell>
                  <TableCell>{job.location || '—'}</TableCell>
                  <TableCell>{job.job_type || '—'}</TableCell>
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
          onJobAdded={() => { setEditingJob(null); onRefresh(); }}
          onEditClose={() => setEditingJob(null)}
        />
      )}
    </>
  )
}