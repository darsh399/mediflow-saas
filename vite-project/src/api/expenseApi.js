import axios from './axiosInstance'

export async function applyExpense(data) {
  const resp = await axios.post('/api/expenses', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
  return resp.data
}

export async function listExpenses(params) {
  const resp = await axios.get('/api/expenses', { params })
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

export default { applyExpense, listExpenses, listMyExpenses, reviewExpense, exportExpenses }
