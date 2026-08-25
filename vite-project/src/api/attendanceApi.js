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

export async function listAttendance(params) {
  const response = await axios.get('/api/attendance', { params })
  return response.data
}

export default { getToday, checkIn, checkOut, toggleBreak, listAttendance }
