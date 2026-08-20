import axios from './axiosInstance'

export async function createVisit(data){
  const resp = await axios.post('/api/visits', data)
  return resp.data
}

export async function doctorVisit(payload){
  const resp = await axios.post('/api/visits/doctor', payload)
  return resp.data
}

export async function medicalVisit(payload){
  const resp = await axios.post('/api/visits/medical', payload)
  return resp.data
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

export default { createVisit, doctorVisit, medicalVisit, listVisits, getVisit, updateVisit, deleteVisit }
