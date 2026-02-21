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

const tooltipStyle = {
  contentStyle: {
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#f9fafb',
  },
  labelStyle: { color: '#f9fafb' },
  itemStyle: { color: '#f9fafb' },
}

const tickStyle = { fontSize: 11, fill: '#9ca3af' }

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden sm:block">{sub}</p>}
    </div>
  )
}

function LockedCard({ title, requiredCount, currentCount }) {
  const pct = Math.min(Math.round((currentCount / requiredCount) * 100), 100)
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 sm:p-6 flex flex-col justify-between opacity-60">
      <div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Available after <strong className="text-gray-600 dark:text-gray-300">{requiredCount}</strong> applications
          &nbsp;·&nbsp; you have <strong className="text-gray-600 dark:text-gray-300">{currentCount}</strong>
        </p>
      </div>
      <div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{pct}%</p>
      </div>
    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6">
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">{title}</h3>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">{sub}</p>}
      {!sub && <div className="mb-3 sm:mb-4" />}
      {children}
    </div>
  )
}

function isResponded(job) {
  return ['Phone Screen', 'Interview', 'Take Home', 'Final Round', 'Offer', 'Rejected'].includes(job.status)
}

// Truncate long source names for mobile
function shortLabel(name, maxLen = 12) {
  return name.length > maxLen ? name.slice(0, maxLen) + '…' : name
}

export default function Dashboard({ jobs }) {
  if (!jobs || !jobs.length) return null

  const total = jobs.length
  const inProgress = jobs.filter(j => ['Phone Screen', 'Interview', 'Take Home', 'Final Round'].includes(j.status)).length
  const interviews = jobs.filter(j => ['Interview', 'Take Home', 'Final Round'].includes(j.status)).length
  const offers = jobs.filter(j => j.status === 'Offer').length
  const rejected = jobs.filter(j => j.status === 'Rejected').length
  const responseRate = total > 0 ? Math.round((jobs.filter(isResponded).length / total) * 100) : 0

  const statusData = Object.entries(
    jobs.reduce((acc, job) => { acc[job.status] = (acc[job.status] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const workTypeData = Object.entries(
    jobs.reduce((acc, job) => {
      if (!job.work_type) return acc
      acc[job.work_type] = (acc[job.work_type] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

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

  const sourceData = Object.entries(
    jobs.reduce((acc, job) => {
      if (!job.source) return acc
      acc[job.source] = (acc[job.source] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const dayData = total >= 10 ? (() => {
    const counts = Array(7).fill(0)
    jobs.forEach(job => { if (!job.applied_date) return; counts[new Date(job.applied_date).getDay()]++ })
    return DAYS.map((name, i) => ({ name: name.slice(0, 3), count: counts[i] }))
  })() : null

  const jobTypeData = total >= 10 ? Object.entries(
    jobs.reduce((acc, job) => {
      if (!job.job_type) return acc
      acc[job.job_type] = (acc[job.job_type] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value })) : null

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
      .map(([name, v]) => ({ name, rate: Math.round((v.responded / v.total) * 100), total: v.total }))
      .sort((a, b) => b.rate - a.rate)
  })() : null

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
      .map(([name, v]) => ({ name, rate: Math.round((v.responded / v.total) * 100), total: v.total }))
      .sort((a, b) => b.rate - a.rate)
  })() : null

  const applyMethodData = total >= 25 ? (() => {
    const easyKeywords = ['easy apply', 'easyapply']
    const map = { 'Easy Apply': { total: 0, responded: 0 }, 'External Apply': { total: 0, responded: 0 } }
    jobs.forEach(job => {
      if (!job.apply_method) return
      const key = easyKeywords.some(k => job.apply_method.toLowerCase().includes(k)) ? 'Easy Apply' : 'External Apply'
      map[key].total++
      if (isResponded(job)) map[key].responded++
    })
    return Object.entries(map).filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({ name, rate: Math.round((v.responded / v.total) * 100), total: v.total }))
  })() : null

  const resumeData = total >= 25 ? (() => {
    const map = {}
    jobs.forEach(job => {
      if (!job.resume_version) return
      if (!map[job.resume_version]) map[job.resume_version] = { total: 0, responded: 0 }
      map[job.resume_version].total++
      if (isResponded(job)) map[job.resume_version].responded++
    })
    return Object.entries(map).filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({ name, rate: Math.round((v.responded / v.total) * 100), total: v.total }))
      .sort((a, b) => b.rate - a.rate)
  })() : null

  return (
    <div className="mb-10">

      {/* Stat Cards — 2 cols mobile, 3 tablet, 6 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Total Applied" value={total} />
        <StatCard label="In Progress" value={inProgress} color="text-purple-600" sub="active applications" />
        <StatCard label="Interviews" value={interviews} color="text-purple-600" />
        <StatCard label="Offers" value={offers} color="text-green-600" />
        <StatCard label="Rejected" value={rejected} color="text-red-500" />
        <StatCard label="Response Rate" value={`${responseRate}%`} color={responseRate > 20 ? 'text-green-600' : 'text-orange-500'} sub="of applications" />
      </div>

      {/* Row 1 — 1 col mobile, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">

        <ChartCard title="Applications by Status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {statusData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[entry.name] || '#cbd5e1' }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Remote vs Hybrid vs On-site">
          {workTypeData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No work type data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={workTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {workTypeData.map((entry) => (
                      <Cell key={entry.name} fill={WORK_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {workTypeData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: WORK_COLORS[entry.name] || '#cbd5e1' }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Applications by Source">
          {sourceData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No source data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceData.map(d => ({ ...d, name: shortLabel(d.name) }))} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" tick={tickStyle} />
                <YAxis type="category" dataKey="name" tick={tickStyle} width={75} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">

        {dayData ? (
          <ChartCard title="Most Active Day of Week">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dayData}>
                <XAxis dataKey="name" tick={tickStyle} />
                <YAxis tick={tickStyle} allowDecimals={false} width={24} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <LockedCard title="Most Active Day of Week" requiredCount={10} currentCount={total} />
        )}

        {jobTypeData ? (
          <ChartCard title="Full-time vs Contract vs Other">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={jobTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {jobTypeData.map((entry, i) => (
                    <Cell key={entry.name} fill={JOB_TYPE_COLORS[i % JOB_TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {jobTypeData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: JOB_TYPE_COLORS[i % JOB_TYPE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </ChartCard>
        ) : (
          <LockedCard title="Full-time vs Contract Split" requiredCount={10} currentCount={total} />
        )}

      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">

        {sourceResponseData ? (
          <ChartCard title="Best Performing Source" sub="Response rate per job board">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sourceResponseData.map(d => ({ ...d, name: shortLabel(d.name) }))} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" unit="%" tick={tickStyle} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={tickStyle} width={75} />
                <Tooltip {...tooltipStyle} formatter={(value) => [`${value}%`, 'Response Rate']} />
                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <LockedCard title="Best Performing Source (Response Rate)" requiredCount={20} currentCount={total} />
        )}

        {jobTypeResponseData ? (
          <ChartCard title="Response Rate by Job Type" sub="Which job types respond most">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={jobTypeResponseData.map(d => ({ ...d, name: shortLabel(d.name) }))} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" unit="%" tick={tickStyle} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={tickStyle} width={75} />
                <Tooltip {...tooltipStyle} formatter={(value) => [`${value}%`, 'Response Rate']} />
                <Bar dataKey="rate" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <LockedCard title="Response Rate by Job Type" requiredCount={20} currentCount={total} />
        )}

      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">

        {applyMethodData ? (
          <ChartCard title="Easy Apply vs External Apply" sub="Which method gets more responses">
            <div className="flex flex-col gap-4 mt-3">
              {applyMethodData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.rate}% <span className="text-gray-400 dark:text-gray-500 font-normal">({item.total} apps)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full" style={{ width: `${item.rate}%`, background: i === 0 ? '#3b82f6' : '#8b5cf6' }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        ) : (
          <LockedCard title="Easy Apply vs External Apply Success Rate" requiredCount={25} currentCount={total} />
        )}

        {resumeData ? (
          <ChartCard title="Resume Version Performance" sub="Response rate by resume version">
            <div className="flex flex-col gap-4 mt-3">
              {resumeData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.rate}% <span className="text-gray-400 dark:text-gray-500 font-normal">({item.total} apps)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full" style={{ width: `${item.rate}%`, background: i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#f59e0b' }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        ) : (
          <LockedCard title="Resume Version Performance" requiredCount={25} currentCount={total} />
        )}

      </div>

      {/* Timeline */}
      {timelineData.length > 1 && (
        <ChartCard title="Applications Over Time">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} allowDecimals={false} width={24} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

    </div>
  )
}