import axios from './axiosInstance'

export async function listShifts(params) {
  return (await axios.get('/api/workforce/shifts', { params })).data
}

export async function createShift(payload) {
  return (await axios.post('/api/workforce/shifts', payload)).data
}

export async function updateShift(id, payload) {
  return (await axios.patch(`/api/workforce/shifts/${id}`, payload)).data
}

export async function deleteShift(id) {
  return (await axios.delete(`/api/workforce/shifts/${id}`)).data
}

export default { listShifts, createShift, updateShift, deleteShift }
