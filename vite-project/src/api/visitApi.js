import axios from './axiosInstance'

export async function createVisit(data){
  const resp = await axios.post('/api/visits', data)
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

export async function getVisit(id){
  const resp = await axios.get(`/api/visits/${id}`)
  return resp.data
}

export async function updateVisit(id, data){
  const resp = await axios.put(`/api/visits/${id}`, data)
  return resp.data
}

export async function deleteVisit(id){
  const resp = await axios.delete(`/api/visits/${id}`)
  return resp.data
}

export default { createVisit, doctorVisit, medicalVisit, downloadVisitPhoto, listVisits, getVisit, updateVisit, deleteVisit }
