'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
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

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-black ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard({ jobs }) {
  if (!jobs.length) return null

  // --- Stat calculations ---
  const total = jobs.length
  const inProgress = jobs.filter(j => ['Phone Screen', 'Interview', 'Take Home', 'Final Round'].includes(j.status)).length
  const interviews = jobs.filter(j => ['Interview', 'Take Home', 'Final Round'].includes(j.status)).length
  const offers = jobs.filter(j => j.status === 'Offer').length
  const rejected = jobs.filter(j => j.status === 'Rejected').length
  const responseRate = total > 0 ? Math.round(((total - jobs.filter(j => ['Applied', 'Ghosted'].includes(j.status)).length) / total) * 100) : 0

  // --- Status breakdown for pie chart ---
  const statusData = Object.entries(
    jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // --- Applications over time (by week) ---
  const byDate = jobs.reduce((acc, job) => {
    if (!job.applied_date) return acc
    const date = new Date(job.applied_date)
    const week = `${date.getMonth() + 1}/${date.getDate()}`
    acc[week] = (acc[week] || 0) + 1
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Applications by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {statusData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.name] || '#cbd5e1' }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Top Sources */}
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