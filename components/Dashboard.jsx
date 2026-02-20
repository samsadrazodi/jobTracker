'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'

const STATUS_COLORS = {
  'Applied':      '#3b82f6',
  'Phone Screen': '#f59e0b',
  'Interview':    '#8b5cf6',
  'Take Home':    '#f97316',
  'Final Round':  '#ec4899',
  'Offer':        '#10b981',
  'Rejected':     '#ef4444',
  'Ghosted':      '#9ca3af',
  'Withdrawn':    '#d1d5db',
}

const WORK_COLORS = {
  'Remote':  '#10b981',
  'Hybrid':  '#f59e0b',
  'On-site': '#f97316',
}

const JOB_TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f97316']

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-black ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function LockedCard({ title, requiredCount, currentCount }) {
  const pct = Math.min(Math.round((currentCount / requiredCount) * 100), 100)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between opacity-60">
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>
        <p className="text-xs text-gray-400 mb-4">
          Available after <strong className="text-gray-600">{requiredCount}</strong> applications
          &nbsp;·&nbsp; you have <strong className="text-gray-600">{currentCount}</strong>
        </p>
      </div>
      <div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-400 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{pct}%</p>
      </div>
    </div>
  )
}

function isResponded(job) {
  return ['Phone Screen', 'Interview', 'Take Home', 'Final Round', 'Offer', 'Rejected'].includes(job.status)
}

export default function Dashboard({ jobs }) {
  if (!jobs.length) return null

  const total = jobs.length
  const inProgress = jobs.filter(j => ['Phone Screen', 'Interview', 'Take Home', 'Final Round'].includes(j.status)).length
  const interviews = jobs.filter(j => ['Interview', 'Take Home', 'Final Round'].includes(j.status)).length
  const offers = jobs.filter(j => j.status === 'Offer').length
  const rejected = jobs.filter(j => j.status === 'Rejected').length
  const responseRate = total > 0 ? Math.round((jobs.filter(isResponded).length / total) * 100) : 0

  // --- Status breakdown ---
  const statusData = Object.entries(
    jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // --- Work type breakdown ---
  const workTypeData = Object.entries(
    jobs.reduce((acc, job) => {
      if (!job.work_type) return acc
      acc[job.work_type] = (acc[job.work_type] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // --- Applications over time ---
  const byDate = jobs.reduce((acc, job) => {
    if (!job.applied_date) return acc
    const date = new Date(job.applied_date)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  const timelineData = Object.entries(byDate)
    .map(([date, count]) => ({ date, count, sortKey: new Date(date + '/2026') }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ date, count }) => ({ date, count }))
    .slice(-10)

  // --- Top sources ---
  const sourceData = Object.entries(
    jobs.reduce((acc, job) => {
      if (!job.source) return acc
      acc[job.source] = (acc[job.source] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // --- Most active day of week (min 10) ---
  const dayData = total >= 10 ? (() => {
    const counts = Array(7).fill(0)
    jobs.forEach(job => {
      if (!job.applied_date) return
      const day = new Date(job.applied_date).getDay()
      counts[day]++
    })
    return DAYS.map((name, i) => ({ name: name.slice(0, 3), count: counts[i] }))
  })() : null

  // --- Job type split (min 10) ---
  const jobTypeData = total >= 10 ? Object.entries(
    jobs.reduce((acc, job) => {
      if (!job.job_type) return acc
      acc[job.job_type] = (acc[job.job_type] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value })) : null

  // --- Best performing source by response rate (min 20) ---
  const sourceResponseData = total >= 20 ? (() => {
    const sourceMap = {}
    jobs.forEach(job => {
      if (!job.source) return
      if (!sourceMap[job.source]) sourceMap[job.source] = { total: 0, responded: 0 }
      sourceMap[job.source].total++
      if (isResponded(job)) sourceMap[job.source].responded++
    })
    return Object.entries(sourceMap)
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({
        name,
        rate: Math.round((v.responded / v.total) * 100),
        total: v.total
      }))
      .sort((a, b) => b.rate - a.rate)
  })() : null

  // --- Response rate by job type (min 20) ---
  const jobTypeResponseData = total >= 20 ? (() => {
    const map = {}
    jobs.forEach(job => {
      if (!job.job_type) return
      if (!map[job.job_type]) map[job.job_type] = { total: 0, responded: 0 }
      map[job.job_type].total++
      if (isResponded(job)) map[job.job_type].responded++
    })
    return Object.entries(map)
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({
        name,
        rate: Math.round((v.responded / v.total) * 100),
        total: v.total
      }))
      .sort((a, b) => b.rate - a.rate)
  })() : null

  // --- Easy Apply vs External success rate (min 25) ---
  const applyMethodData = total >= 25 ? (() => {
    const easyKeywords = ['easy apply', 'easyapply']
    const map = { 'Easy Apply': { total: 0, responded: 0 }, 'External Apply': { total: 0, responded: 0 } }
    jobs.forEach(job => {
      if (!job.apply_method) return
      const isEasy = easyKeywords.some(k => job.apply_method.toLowerCase().includes(k))
      const key = isEasy ? 'Easy Apply' : 'External Apply'
      map[key].total++
      if (isResponded(job)) map[key].responded++
    })
    return Object.entries(map)
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({
        name,
        rate: Math.round((v.responded / v.total) * 100),
        total: v.total
      }))
  })() : null

  // --- Resume version performance (min 25) ---
  const resumeData = total >= 25 ? (() => {
    const map = {}
    jobs.forEach(job => {
      if (!job.resume_version) return
      if (!map[job.resume_version]) map[job.resume_version] = { total: 0, responded: 0 }
      map[job.resume_version].total++
      if (isResponded(job)) map[job.resume_version].responded++
    })
    return Object.entries(map)
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({
        name,
        rate: Math.round((v.responded / v.total) * 100),
        total: v.total
      }))
      .sort((a, b) => b.rate - a.rate)
  })() : null

  return (
    <div className="mb-10">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Applied" value={total} />
        <StatCard label="In Progress" value={inProgress} color="text-purple-600" sub="active applications" />
        <StatCard label="Interviews" value={interviews} color="text-purple-600" />
        <StatCard label="Offers" value={offers} color="text-green-600" />
        <StatCard label="Rejected" value={rejected} color="text-red-500" />
        <StatCard label="Response Rate" value={`${responseRate}%`} color={responseRate > 20 ? 'text-green-600' : 'text-orange-500'} sub="of applications" />
      </div>

      {/* Row 1 — Status, Work Type, Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

        {/* Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Applications by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {statusData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.name] || '#cbd5e1' }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Work Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Remote vs Hybrid vs On-site</h3>
          {workTypeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No work type data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={workTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {workTypeData.map((entry) => (
                      <Cell key={entry.name} fill={WORK_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {workTypeData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: WORK_COLORS[entry.name] || '#cbd5e1' }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sources volume */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Applications by Source</h3>
          {sourceData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No source data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Row 2 — Most active day + Job type split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Most active day */}
        {dayData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Most Active Day of Week</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <LockedCard title="Most Active Day of Week" requiredCount={10} currentCount={total} />
        )}

        {/* Job type split */}
        {jobTypeData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Full-time vs Contract vs Other</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={jobTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {jobTypeData.map((entry, i) => (
                    <Cell key={entry.name} fill={JOB_TYPE_COLORS[i % JOB_TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {jobTypeData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: JOB_TYPE_COLORS[i % JOB_TYPE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>
        ) : (
          <LockedCard title="Full-time vs Contract Split" requiredCount={10} currentCount={total} />
        )}

      </div>

      {/* Row 3 — Response rate insights (min 20) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Best source by response rate */}
        {sourceResponseData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Best Performing Source</h3>
            <p className="text-xs text-gray-400 mb-4">Response rate per job board</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceResponseData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(value) => [`${value}%`, 'Response Rate']} />
                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <LockedCard title="Best Performing Source (Response Rate)" requiredCount={20} currentCount={total} />
        )}

        {/* Response rate by job type */}
        {jobTypeResponseData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Response Rate by Job Type</h3>
            <p className="text-xs text-gray-400 mb-4">Which job types respond most</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={jobTypeResponseData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(value) => [`${value}%`, 'Response Rate']} />
                <Bar dataKey="rate" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <LockedCard title="Response Rate by Job Type" requiredCount={20} currentCount={total} />
        )}

      </div>

      {/* Row 4 — Easy Apply + Resume version (min 25) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Easy Apply vs External */}
        {applyMethodData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Easy Apply vs External Apply</h3>
            <p className="text-xs text-gray-400 mb-4">Which method gets more responses</p>
            <div className="flex flex-col gap-4 mt-4">
              {applyMethodData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="font-bold text-gray-900">{item.rate}% <span className="text-gray-400 font-normal">({item.total} apps)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${item.rate}%`,
                        background: i === 0 ? '#3b82f6' : '#8b5cf6'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <LockedCard title="Easy Apply vs External Apply Success Rate" requiredCount={25} currentCount={total} />
        )}

        {/* Resume version performance */}
        {resumeData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Resume Version Performance</h3>
            <p className="text-xs text-gray-400 mb-4">Response rate by resume version</p>
            <div className="flex flex-col gap-4 mt-4">
              {resumeData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="font-bold text-gray-900">{item.rate}% <span className="text-gray-400 font-normal">({item.total} apps)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${item.rate}%`,
                        background: i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <LockedCard title="Resume Version Performance" requiredCount={25} currentCount={total} />
        )}

      </div>

      {/* Timeline */}
      {timelineData.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Applications Over Time</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}