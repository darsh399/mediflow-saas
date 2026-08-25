import axios from './axiosInstance'

export async function fetchUser(id) {
  const resp = await axios.get(`/api/users/${id}`)
  return resp.data
}

export async function updateUser(id, data) {
  const resp = await axios.put(`/api/users/${id}`, data)
  return resp.data
}

export async function createUser(data) {
  const resp = await axios.post('/api/users', data)
  return resp.data
}

export async function listUsers() {
  const resp = await axios.get('/api/users')
  return resp.data
}

export async function searchUsers(query) {
  const params = new URLSearchParams(query || {}).toString()
  const resp = await axios.get(`/api/users/search?${params}`)
  return resp.data
}

export async function deleteUser(id) {
  const resp = await axios.delete(`/api/users/${id}`)
  return resp.data
}

export async function changeUserStatus(id, action) {
  const resp = await axios.patch(`/api/users/${id}/status`, { action })
  return resp.data
}

export async function promoteEmployee(id, data) {
  const resp = await axios.post(`/api/users/${id}/promote`, data)
  return resp.data
}

export async function updateProfile(id, data) {
  const resp = await axios.put(`/api/users/${id}/profile`, data)
  return resp.data
}

// Get visits created by the currently logged-in employee/MR
export async function getAllMyVisits() {
  const resp = await axios.get('/api/users/myvisits')
  return resp.data
}

export default {
  fetchUser,
  createUser,
  updateUser,
  listUsers,
  changeUserStatus,
  promoteEmployee,
  searchUsers,
  deleteUser,
  updateProfile,
  getAllMyVisits
}