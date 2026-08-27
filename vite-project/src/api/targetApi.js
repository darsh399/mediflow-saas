import axios from './axiosInstance'

export async function listTargets(params) {
  return (await axios.get('/api/targets', { params })).data
}

export async function getTarget(id) {
  return (await axios.get(`/api/targets/${id}`)).data
}

export async function getTargetDashboard(params) {
  return (await axios.get('/api/targets/dashboard', { params })).data
}

export async function createTarget(payload) {
  return (await axios.post('/api/targets', payload)).data
}

export async function updateTarget(id, payload) {
  return (await axios.put(`/api/targets/${id}`, payload)).data
}

export async function deleteTarget(id) {
  return (await axios.delete(`/api/targets/${id}`)).data
}

export default { listTargets, getTarget, getTargetDashboard, createTarget, updateTarget, deleteTarget }
