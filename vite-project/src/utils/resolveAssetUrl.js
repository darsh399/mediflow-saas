// Backend-uploaded files (product images, leave/expense attachments, etc.)
// come back as paths relative to the API server (e.g. "/uploads/..."), not
// the frontend origin. A plain <img src="/uploads/...">/<a href> resolves
// against the current page's origin (the Vite dev server or wherever the SPA
// is hosted), which 404s since that's not where the file actually lives.
// Same fix already used locally in EmployeeOnboarding.jsx — centralized here
// so every consumer resolves it the same way.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function resolveAssetUrl(url) {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/.test(url)) return url
  return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`
}

export default resolveAssetUrl
