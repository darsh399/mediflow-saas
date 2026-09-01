import axios from './axiosInstance'

export async function applyExpense(data) {
  const resp = await axios.post('/api/expenses', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
  return resp.data
}

export async function listExpenses(params, config) {
  const resp = await axios.get('/api/expenses', { params, ...config })
  return resp.data
}

export async function listMyExpenses(params) {
  const resp = await axios.get('/api/expenses', { params: { ...(params || {}), mine: true } })
  return resp.data
}

export async function reviewExpense(id, data) {
  const resp = await axios.post(`/api/expenses/${id}/review`, data)
  return resp.data
}

export async function exportExpenses(params) {
  const resp = await axios.get('/api/expenses/export', { params, responseType: 'blob' })
  return resp.data
}

export async function getSettings() {
  const resp = await axios.get('/api/expenses/settings')
  return resp.data
}

export async function updateSettings(payload) {
  const resp = await axios.patch('/api/expenses/settings', payload)
  return resp.data
}

export async function previewTravelClaim(params) {
  const resp = await axios.get('/api/expenses/travel-claim/preview', { params })
  return resp.data
}

export default { applyExpense, listExpenses, listMyExpenses, reviewExpense, exportExpenses, getSettings, updateSettings, previewTravelClaim }
