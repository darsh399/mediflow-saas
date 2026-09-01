import axios from './axiosInstance'

export async function getToday() {
  const response = await axios.get('/api/attendance/today')
  return response.data
}

export async function checkIn(location, platform) {
  const response = await axios.post('/api/attendance/check-in', { location, platform })
  return response.data
}

export async function checkOut(location) {
  const response = await axios.post('/api/attendance/check-out', { location })
  return response.data
}

export async function toggleBreak() {
  const response = await axios.post('/api/attendance/break')
  return response.data
}

export async function listAttendance(params, config) {
  const response = await axios.get('/api/attendance', { params, ...config })
  return response.data
}

export async function getEmployeeAttendance(employeeId, params) {
  const response = await axios.get(`/api/attendance/employee/${employeeId}`, { params })
  return response.data
}

export async function requestCorrection(id, payload) {
  const response = await axios.post(`/api/attendance/${id}/correction`, payload)
  return response.data
}

export async function reviewCorrection(id, payload) {
  const response = await axios.post(`/api/attendance/${id}/correction/review`, payload)
  return response.data
}

export default { getToday, checkIn, checkOut, toggleBreak, listAttendance, getEmployeeAttendance, requestCorrection, reviewCorrection }
