import axios from './axiosInstance'

export async function listHolidays(params) {
  const response = await axios.get('/api/calendar/holidays', { params })
  return response.data
}

export async function getSettings() {
  const response = await axios.get('/api/calendar/holidays/settings')
  return response.data
}

export async function updateSettings(weeklyWorkingDays) {
  const response = await axios.patch('/api/calendar/holidays/settings', { weeklyWorkingDays })
  return response.data
}

export async function createHoliday(payload) {
  const response = await axios.post('/api/calendar/holidays', payload)
  return response.data
}

export async function deleteHoliday(id) {
  const response = await axios.delete(`/api/calendar/holidays/${id}`)
  return response.data
}

export default { listHolidays, getSettings, updateSettings, createHoliday, deleteHoliday }
