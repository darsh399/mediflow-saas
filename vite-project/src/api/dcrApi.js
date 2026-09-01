import axios from './axiosInstance'

export async function getDay(payload) {
  const resp = await axios.post('/api/dcr/day', payload)
  return resp.data
}

export async function listReports(params, config) {
  const resp = await axios.get('/api/dcr', { params, ...config })
  return resp.data
}

export async function updateReport(id, payload) {
  const resp = await axios.patch(`/api/dcr/${id}`, payload)
  return resp.data
}

export async function submitReport(id) {
  const resp = await axios.post(`/api/dcr/${id}/submit`)
  return resp.data
}

export async function reviewReport(id, payload) {
  const resp = await axios.post(`/api/dcr/${id}/review`, payload)
  return resp.data
}

export default { getDay, listReports, updateReport, submitReport, reviewReport }
