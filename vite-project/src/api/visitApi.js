import axios from './axiosInstance'

export async function createVisit(data){
  const resp = await axios.post('/api/visits', data)
  return resp.data
}

// Admin/hr_manager/manager schedules a doctor/medical visit for an employee.
export async function assignVisit(data){
  const resp = await axios.post('/api/visits/assign', data)
  return resp.data
}

export async function doctorVisit(payload){
  const body = payload.visitPhoto ? toMultipart(payload) : payload
  const resp = await axios.post('/api/visits/doctor', body)
  return resp.data
}

export async function downloadVisitPhoto(id){
  const resp = await axios.get(`/api/visits/${id}/photo`, { responseType: 'blob' })
  return resp.data
}

export async function medicalVisit(payload){
  const body = payload.visitPhoto ? toMultipart(payload) : payload
  const resp = await axios.post('/api/visits/medical', body)
  return resp.data
}

function toMultipart(payload) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value)
  })
  return formData
}

export async function listVisits(){
  const resp = await axios.get('/api/visits')
  return resp.data
}

export async function listEmployeeVisitSummary(params) {
  const resp = await axios.get('/api/visits/employee-summary', { params })
  return resp.data
}

export async function listEmployeeVisits(employeeId, params) {
  const resp = await axios.get(`/api/visits/employee/${employeeId}`, { params })
  return resp.data
}

export async function getVisitCalendarSummary(params) {
  const resp = await axios.get('/api/visits/calendar-summary', { params })
  return resp.data
}

export async function getTopPerformers(params) {
  const resp = await axios.get('/api/visits/top-performers', { params })
  return resp.data
}

export async function getVisit(id){
  const resp = await axios.get(`/api/visits/${id}`)
  return resp.data
}

export async function updateVisit(id, data){
  const resp = await axios.put(`/api/visits/${id}`, data)
  return resp.data
}

// Assigned employee reschedules their own scheduled visit to a new date.
export async function rescheduleVisit(id, data){
  const resp = await axios.patch(`/api/visits/${id}/reschedule`, data)
  return resp.data
}

// Assigned employee cancels their own scheduled visit.
export async function cancelVisit(id, data){
  const resp = await axios.patch(`/api/visits/${id}/cancel`, data)
  return resp.data
}

// Assigned employee marks their own scheduled visit done.
export async function completeVisit(id, data){
  const resp = await axios.patch(`/api/visits/${id}/complete`, data)
  return resp.data
}

export async function deleteVisit(id){
  const resp = await axios.delete(`/api/visits/${id}`)
  return resp.data
}

export default { createVisit, assignVisit, doctorVisit, medicalVisit, downloadVisitPhoto, listVisits, listEmployeeVisitSummary, listEmployeeVisits, getVisitCalendarSummary, getTopPerformers, getVisit, updateVisit, rescheduleVisit, cancelVisit, completeVisit, deleteVisit }
