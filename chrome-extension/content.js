let sidebarOpen = false
let sidebarEl = null
let overlayEl = null

// -------------------------------------------------------
// JOB EXTRACTION
// -------------------------------------------------------
function extractJobData() {
  const url = window.location.href
  const hostname = window.location.hostname

  let data = {
    job_url: url,
    company_name: '',
    job_title: '',
    location: '',
    work_type: '',
    job_type: '',
    source: '',
    apply_method: '',
  }

  if (hostname.includes('linkedin.com')) {
    data.source = 'LinkedIn'

    data.job_title =
      document.querySelector('h1.t-24')?.innerText?.trim() ||
      document.querySelector('h1.t-24.t-bold')?.innerText?.trim() ||
      document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText?.trim() ||
      document.querySelector('.jobs-unified-top-card__job-title')?.innerText?.trim() ||
      document.querySelector('h1')?.innerText?.trim() || ''

    data.company_name =
      document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText?.trim() ||
      document.querySelector('.jobs-unified-top-card__company-name')?.innerText?.trim() ||
      document.querySelector('[data-tracking-control-name="public_jobs_topcard-org-name"]')?.innerText?.trim() ||
      document.querySelector('.topcard__org-name-link')?.innerText?.trim() ||
      document.querySelector('a.ember-view.t-black.t-normal')?.innerText?.trim() || ''

    const locationSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.jobs-unified-top-card__primary-description',
      '.topcard__flavor--bullet',
      '[class*="primary-description"]',
    ]
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel)
      if (el?.innerText?.trim()) {
        data.location = el.innerText.trim().split('·')[0].split('\n')[0].trim()
        break
      }
    }

    const pageText = document.body.innerText.toLowerCase()
    if (pageText.includes('on-site') || pageText.includes('onsite')) data.work_type = 'On-site'
    else if (pageText.includes('hybrid')) data.work_type = 'Hybrid'
    else if (pageText.includes('remote')) data.work_type = 'Remote'

    if (pageText.includes('full-time') || pageText.includes('full time')) data.job_type = 'Full-Time'
    else if (pageText.includes('part-time') || pageText.includes('part time')) data.job_type = 'Part-Time'
    else if (pageText.includes('contract-to-hire') || pageText.includes('contract to hire')) data.job_type = 'Contract-to-hire'
    else if (pageText.includes('contract')) data.job_type = 'Contract'
    else if (pageText.includes('freelance')) data.job_type = 'Freelance'

    const applyBtnSelectors = [
      '.jobs-apply-button',
      '[data-control-name="jobdetails_topcard_inapply"]',
      'button[aria-label*="Easy Apply"]',
      'button[aria-label*="Apply"]',
    ]
    for (const sel of applyBtnSelectors) {
      const btn = document.querySelector(sel)
      if (btn) {
        const btnText = (btn.innerText.trim() + (btn.getAttribute('aria-label') || '')).toLowerCase()
        data.apply_method = btnText.includes('easy') ? 'LinkedIn- Easy Apply' : 'LinkedIn- External Apply'
        break
      }
    }
  }

  else if (hostname.includes('dice.com')) {
    data.source = 'Dice'
    data.job_title = document.querySelector('h1[data-cy="jobTitle"]')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim() || ''
    data.company_name = document.querySelector('a[data-cy="companyNameLink"]')?.innerText?.trim() || ''
    const locationText = document.querySelector('[data-cy="location"]')?.innerText?.trim() || ''
    data.location = locationText.split('·')[0].split('\n')[0].trim()
    const pageText = document.body.innerText.toLowerCase()
    if (pageText.includes('on-site')) data.work_type = 'On-site'
    else if (pageText.includes('hybrid')) data.work_type = 'Hybrid'
    else if (pageText.includes('remote')) data.work_type = 'Remote'
    if (pageText.includes('full-time') || pageText.includes('full time')) data.job_type = 'Full-Time'
    else if (pageText.includes('contract-to-hire')) data.job_type = 'Contract-to-hire'
    else if (pageText.includes('contract')) data.job_type = 'Contract'
    const applyBtn = document.querySelector('apply-button-wc') || document.querySelector('[data-cy="applyButton"]')
    if (applyBtn) data.apply_method = applyBtn.innerText?.toLowerCase().includes('easy') ? 'Dice-EasyApply' : 'Dice-External'
  }

  else if (hostname.includes('indeed.com')) {
    data.source = 'Indeed'
    data.job_title = document.querySelector('h1.jobsearch-JobInfoHeader-title')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim() || ''
    data.company_name = document.querySelector('[data-testid="inlineHeader-companyName"] a')?.innerText?.trim() || ''
    const locationText = document.querySelector('[data-testid="job-location"]')?.innerText?.trim() || ''
    data.location = locationText.split('·')[0].split('\n')[0].trim()
    const pageText = document.body.innerText.toLowerCase()
    if (pageText.includes('on-site')) data.work_type = 'On-site'
    else if (pageText.includes('hybrid')) data.work_type = 'Hybrid'
    else if (pageText.includes('remote')) data.work_type = 'Remote'
    if (pageText.includes('full-time') || pageText.includes('full time')) data.job_type = 'Full-Time'
    else if (pageText.includes('contract')) data.job_type = 'Contract'
    data.apply_method = 'Indeed'
  }

  else {
    data.source = 'Company Website'
    data.apply_method = 'Company Website'
    data.job_title = document.querySelector('h1')?.innerText?.trim() || document.title?.split('|')[0]?.trim() || ''
    data.company_name = document.querySelector('meta[property="og:site_name"]')?.content?.trim() || window.location.hostname.replace('www.', '').split('.')[0] || ''
    const locationCandidates = document.querySelectorAll('[class*="location"], [class*="Location"]')
    if (locationCandidates.length > 0) data.location = locationCandidates[0].innerText.trim().split('·')[0].split('\n')[0].trim()
    const pageText = document.body.innerText.toLowerCase()
    if (pageText.includes('on-site')) data.work_type = 'On-site'
    else if (pageText.includes('hybrid')) data.work_type = 'Hybrid'
    else if (pageText.includes('remote')) data.work_type = 'Remote'
    if (pageText.includes('full-time') || pageText.includes('full time')) data.job_type = 'Full-Time'
    else if (pageText.includes('contract')) data.job_type = 'Contract'
  }

  return data
}

// -------------------------------------------------------
// SIDEBAR
// -------------------------------------------------------
function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;')
}

function closeSidebar() {
  if (sidebarEl) {
    sidebarEl.style.transform = 'translateX(100%)'
    setTimeout(() => {
      sidebarEl?.remove()
      overlayEl?.remove()
      sidebarEl = null
      overlayEl = null
      sidebarOpen = false
    }, 300)
  }
}

function showMessage(msg, type) {
  const el = document.getElementById('jt-message')
  if (!el) return
  el.textContent = msg
  el.style.display = 'block'
  el.style.background = type === 'error' ? '#fef2f2' : '#f0fdf4'
  el.style.border = type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0'
  el.style.color = type === 'error' ? '#dc2626' : '#16a34a'
}

async function handleSidebarSave() {
  const btn = document.getElementById('jt-save-btn')
  const company = document.getElementById('jt-company').value.trim()
  const title = document.getElementById('jt-title').value.trim()

  if (!company || !title) {
    showMessage('Company name and job title are required.', 'error')
    return
  }

  btn.textContent = 'Saving...'
  btn.disabled = true

  try {
    const stored = await chrome.storage.local.get(['jt_user_email', 'jt_user_password'])
    const { jt_user_email: email, jt_user_password: password } = stored

    const SUPABASE_URL = 'https://ykrlidmcyedsnihovvdw.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcmxpZG1jeWVkc25paG92dmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDM2MTksImV4cCI6MjA4NzExOTYxOX0.QMxNtx1w1tgwBxzhPXFrfHWQAkv8l1BvGF7q68JIgis'

    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    })
    const authData = await authRes.json()
    if (!authRes.ok) throw new Error(authData.error_description || 'Auth failed')

    const payload = {
      user_id: authData.user.id,
      company_name: company,
      job_title: title,
      status: document.getElementById('jt-status').value,
      applied_date: document.getElementById('jt-date').value,
      source: document.getElementById('jt-source').value || null,
      apply_method: document.getElementById('jt-method').value || null,
      location: document.getElementById('jt-location').value || null,
      work_type: document.getElementById('jt-worktype').value || null,
      job_type: document.getElementById('jt-jobtype').value || null,
      job_url: window.location.href,
      cover_letter: false,
    }

    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authData.access_token}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    })

    if (!saveRes.ok) {
      const err = await saveRes.json()
      throw new Error(err.message || 'Failed to save')
    }

    // Show success state
    document.getElementById('jt-form').innerHTML = `
      <div style="text-align:center; padding: 40px 20px;">
        <div style="font-size:48px; margin-bottom:12px;">✅</div>
        <h2 style="font-size:18px; font-weight:800; margin-bottom:8px; color:#111;">Job Saved!</h2>
        <p style="font-size:13px; color:#6b7280;">Added to your JobTracker successfully.</p>
        <button id="jt-save-another" style="margin-top:20px; width:100%; padding:10px; background:#111827; color:white; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">
          Save Another Job
        </button>
      </div>
    `
    document.getElementById('jt-save-another').addEventListener('click', () => {
      renderSidebarForm(extractJobData())
    })

  } catch (err) {
    showMessage(err.message, 'error')
    btn.textContent = '💾 Save to JobTracker'
    btn.disabled = false
  }
}

function renderSignIn() {
  document.getElementById('jt-form').innerHTML = `
    <div style="padding: 20px;">
      <h2 style="font-size:15px; font-weight:700; margin-bottom:6px; color:#111;">Sign in to JobTracker</h2>
      <p style="font-size:12px; color:#6b7280; margin-bottom:16px;">Don't have an account? <a href="https://your-jobtracker-site.com" target="_blank" style="color:#3b82f6;">Sign up here</a></p>
      <input id="jt-email" type="email" placeholder="Email address" style="${inputStyle}" />
      <input id="jt-password" type="password" placeholder="Password" style="${inputStyle} margin-top:8px;" />
      <div id="jt-message" style="display:none; font-size:11px; padding:8px 10px; border-radius:6px; margin:8px 0;"></div>
      <button id="jt-signin-btn" style="${btnStyle}">Sign In</button>
    </div>
  `
  document.getElementById('jt-signin-btn').addEventListener('click', handleSignIn)
}

async function handleSignIn() {
  const email = document.getElementById('jt-email').value.trim()
  const password = document.getElementById('jt-password').value.trim()
  const btn = document.getElementById('jt-signin-btn')

  if (!email || !password) {
    showMessage('Email and password are required.', 'error')
    return
  }

  btn.textContent = 'Signing in...'
  btn.disabled = true

  try {
    const SUPABASE_URL = 'https://ykrlidmcyedsnihovvdw.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcmxpZG1jeWVkc25paG92dmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDM2MTksImV4cCI6MjA4NzExOTYxOX0.QMxNtx1w1tgwBxzhPXFrfHWQAkv8l1BvGF7q68JIgis'

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok || !data.access_token) throw new Error(data.error_description || 'Invalid credentials')

    await chrome.storage.local.set({ jt_user_email: email, jt_user_password: password })
    renderSidebarForm(extractJobData())
  } catch (err) {
    showMessage(err.message, 'error')
    btn.textContent = 'Sign In'
    btn.disabled = false
  }
}

const inputStyle = `width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; font-size:12px; outline:none; box-sizing:border-box; font-family:inherit; background:white;`
const selectStyle = `width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; font-size:12px; outline:none; box-sizing:border-box; font-family:inherit; background:white;`
const btnStyle = `width:100%; padding:11px; background:#111827; color:white; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; margin-top:12px; font-family:inherit;`

const statusOptions = ['Applied', 'Phone Screen', 'Interview', 'Take Home', 'Final Round', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn']
const applyMethodOptions = ['LinkedIn- Easy Apply', 'LinkedIn- External Apply', 'Company Website', 'Indeed', 'Wellfound', 'Recruiter Email/InMail', 'Referral', 'Dice-EasyApply', 'Dice-External', 'Other']
const jobTypeOptions = ['Full-Time', 'Part-Time', 'Contract', 'Contract-to-hire', 'Freelance']
const workTypeOptions = ['Remote', 'Hybrid', 'On-site']
const sourceOptions = ['LinkedIn', 'Dice', 'Indeed', 'Company Website', 'Referral', 'Other']

function renderSidebarForm(jobData) {
  document.getElementById('jt-form').innerHTML = `
    <div style="padding:16px; overflow-y:auto; height:100%;">
      <div style="display:inline-block; background:#dbeafe; color:#1d4ed8; font-size:10px; font-weight:700; padding:3px 8px; border-radius:99px; margin-bottom:14px;">
        ✓ Detected from ${jobData.source || 'this page'}
      </div>

      <div style="margin-bottom:10px;">
        <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Company Name *</label>
        <input id="jt-company" value="${esc(jobData.company_name)}" placeholder="Company name" style="${inputStyle}" />
      </div>

      <div style="margin-bottom:10px;">
        <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Job Title *</label>
        <input id="jt-title" value="${esc(jobData.job_title)}" placeholder="Job title" style="${inputStyle}" />
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
        <div>
          <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Status</label>
          <select id="jt-status" style="${selectStyle}">
            ${statusOptions.map(s => `<option ${s === 'Applied' ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Date Applied</label>
          <input type="date" id="jt-date" value="${new Date().toISOString().split('T')[0]}" style="${inputStyle}" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
        <div>
          <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Source</label>
          <select id="jt-source" style="${selectStyle}">
            ${sourceOptions.map(s => `<option ${s === jobData.source ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Apply Method</label>
          <select id="jt-method" style="${selectStyle}">
            <option value="">— Select —</option>
            ${applyMethodOptions.map(s => `<option ${s === jobData.apply_method ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Location</label>
        <input id="jt-location" value="${esc(jobData.location)}" placeholder="e.g. New York, NY" style="${inputStyle}" />
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
        <div>
          <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Work Type</label>
          <select id="jt-worktype" style="${selectStyle}">
            <option value="">— Select —</option>
            ${workTypeOptions.map(s => `<option ${s === jobData.work_type ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:3px;">Job Type</label>
          <select id="jt-jobtype" style="${selectStyle}">
            <option value="">— Select —</option>
            ${jobTypeOptions.map(s => `<option ${s === jobData.job_type ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="jt-message" style="display:none; font-size:11px; padding:8px 10px; border-radius:6px; margin-bottom:8px;"></div>

      <button id="jt-save-btn" style="${btnStyle}">💾 Save to JobTracker</button>
      <button id="jt-signout-btn" style="width:100%; padding:9px; background:#f3f4f6; color:#374151; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; margin-top:8px; font-family:inherit;">
        🔓 Sign Out
      </button>
    </div>
  `

  document.getElementById('jt-save-btn').addEventListener('click', handleSidebarSave)
  document.getElementById('jt-signout-btn').addEventListener('click', () => {
    chrome.storage.local.remove(['jt_user_email', 'jt_user_password'])
    renderSignIn()
  })
}

async function openSidebar() {
  if (sidebarOpen) { closeSidebar(); return }
  sidebarOpen = true

  // Create sidebar container
  sidebarEl = document.createElement('div')
  sidebarEl.id = 'jt-sidebar'
  sidebarEl.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 360px;
    height: 100vh;
    background: #f9fafb;
    box-shadow: -4px 0 24px rgba(0,0,0,0.15);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
  `

  sidebarEl.innerHTML = `
    <!-- Header -->
    <div style="background:#111827; color:white; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
      <div>
        <div style="font-size:16px; font-weight:800; letter-spacing:-0.3px;">Job<span style="color:#3b82f6;">Tracker</span></div>
        <div style="font-size:11px; color:#9ca3af; margin-top:2px;">Save this job to your tracker</div>
      </div>
      <button id="jt-close-btn" style="background:none; border:none; color:#9ca3af; font-size:22px; cursor:pointer; line-height:1; padding:0;">✕</button>
    </div>

    <!-- Scrollable form area -->
    <div id="jt-form" style="flex:1; overflow-y:auto;"></div>
  `

  document.body.appendChild(sidebarEl)

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      sidebarEl.style.transform = 'translateX(0)'
    })
  })

  document.getElementById('jt-close-btn').addEventListener('click', closeSidebar)

  // Check if signed in
  const stored = await chrome.storage.local.get(['jt_user_email', 'jt_user_password'])
  if (!stored.jt_user_email || !stored.jt_user_password) {
    renderSignIn()
  } else {
    renderSidebarForm(extractJobData())
  }
}

// -------------------------------------------------------
// LISTEN FOR TOGGLE MESSAGE FROM BACKGROUND
// -------------------------------------------------------
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggleSidebar') {
    openSidebar()
  }
})