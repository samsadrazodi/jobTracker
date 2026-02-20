import { supabase } from '../lib/supabase'

export default async function Home() {
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const { data: jobs, error } = await supabase
    .from('applications')
    .select('*')

  if (error) {
    return <p>Error loading jobs: {error.message}</p>
  }
  console.log('error:', error)
console.log('jobs:', jobs)

  return (
    <main style={{ padding: '40px' }}>
      <h1>My Job Applications</h1>
      <p>{jobs.length} applications total</p>
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            <strong>{job.company_name}</strong> — {job.job_title} — {job.status}
          </li>
        ))}
      </ul>
    </main>
  )
}