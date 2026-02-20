'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { Button } from '@/components/ui/button'

const statusOptions = ['Applied', 'Phone Screen', 'Interview', 'Take Home', 'Final Round', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn']
const sourceOptions = ['LinkedIn', 'Dice', 'Indeed', 'Company Site', 'Referral', 'Other']
const applyMethodOptions = ['LinkedIn Easy Apply', 'LinkedIn External', 'Dice Easy Apply', 'Direct', 'Email', 'Referral']
const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Contract-to-hire', 'Freelance']

const emptyForm = {
  company_name: '',
  job_title: '',
  status: 'Applied',
  applied_date: new Date().toISOString().split('T')[0],
  job_url: '',
  source: '',
  apply_method: '',
  location: '',
  job_type: '',
  resume_version: '',
  cover_letter: false,
  notes: '',
  follow_up_date: '',
}

export default function AddJobForm({ onJobAdded, editJob, onEditClose }) {
  const supabase = createClient()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  // When editJob is passed in, open the form pre-filled
  useEffect(() => {
    if (editJob) {
      setForm({
        company_name: editJob.company_name || '',
        job_title: editJob.job_title || '',
        status: editJob.status || 'Applied',
        applied_date: editJob.applied_date || '',
        job_url: editJob.job_url || '',
        source: editJob.source || '',
        apply_method: editJob.apply_method || '',
        location: editJob.location || '',
        job_type: editJob.job_type || '',
        resume_version: editJob.resume_version || '',
        cover_letter: editJob.cover_letter || false,
        notes: editJob.notes || '',
        follow_up_date: editJob.follow_up_date || '',
      })
      setOpen(true)
    }
  }, [editJob])

  function handleClose() {
    setOpen(false)
    setForm(emptyForm)
    setError(null)
    if (onEditClose) onEditClose()
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    )

    let error

    if (editJob) {
      // Update existing row
      const { error: updateError } = await supabase
        .from('applications')
        .update(cleanedForm)
        .eq('id', editJob.id)
      error = updateError
    } else {
      // Insert new row
      const { error: insertError } = await supabase
        .from('applications')
        .insert([cleanedForm])
      error = insertError
    }

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      handleClose()
      onJobAdded()
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <>
      {!editJob && (
        <Button onClick={() => setOpen(true)}>
          + Add Application
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editJob ? 'Edit Application' : 'Add Job Application'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">

              <div>
                <label className={labelClass}>Company Name *</label>
                <input name="company_name" value={form.company_name} onChange={handleChange} required className={inputClass} placeholder="e.g. Google" />
              </div>

              <div>
                <label className={labelClass}>Job Title *</label>
                <input name="job_title" value={form.job_title} onChange={handleChange} required className={inputClass} placeholder="e.g. Frontend Engineer" />
              </div>

              <div>
                <label className={labelClass}>Status *</label>
                <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                  {statusOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Date Applied *</label>
                <input type="date" name="applied_date" value={form.applied_date} onChange={handleChange} required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Source</label>
                <select name="source" value={form.source} onChange={handleChange} className={inputClass}>
                  <option value="">— Select —</option>
                  {sourceOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Apply Method</label>
                <select name="apply_method" value={form.apply_method} onChange={handleChange} className={inputClass}>
                  <option value="">— Select —</option>
                  {applyMethodOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Location</label>
                <input name="location" value={form.location} onChange={handleChange} className={inputClass} placeholder="e.g. New York, NY or Remote" />
              </div>

              <div>
                <label className={labelClass}>Job Type</label>
                <select name="job_type" value={form.job_type} onChange={handleChange} className={inputClass}>
                  <option value="">— Select —</option>
                  {jobTypeOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Job URL</label>
                <input name="job_url" value={form.job_url} onChange={handleChange} className={inputClass} placeholder="https://..." />
              </div>

              <div>
                <label className={labelClass}>Resume Version</label>
                <input name="resume_version" value={form.resume_version} onChange={handleChange} className={inputClass} placeholder="e.g. v3-frontend" />
              </div>

              <div>
                <label className={labelClass}>Follow Up Date</label>
                <input type="date" name="follow_up_date" value={form.follow_up_date} onChange={handleChange} className={inputClass} />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="cover_letter" id="cover_letter" checked={form.cover_letter} onChange={handleChange} className="w-4 h-4" />
                <label htmlFor="cover_letter" className="text-sm font-medium text-gray-700">Cover Letter Included</label>
              </div>

              <div className="col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} className={inputClass} rows={3} placeholder="Any notes, contacts, interview prep..." />
              </div>

              {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}

              <div className="col-span-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editJob ? 'Save Changes' : 'Save Application'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}