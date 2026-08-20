import axios from './axiosInstance'

export async function createMedical(payload){
  const resp = await axios.post('/api/medicals', payload)
  return resp.data
}

export async function listMedicals(){
  const resp = await axios.get('/api/medicals')
  return resp.data
}

export async function getMedical(id){
  const resp = await axios.get(`/api/medicals/${id}`)
  return resp.data
}

export async function updateMedical(id, payload){
  const resp = await axios.put(`/api/medicals/${id}`, payload)
  return resp.data
}

export async function deleteMedical(id){
  const resp = await axios.delete(`/api/medicals/${id}`)
  return resp.data
}

export default { createMedical, listMedicals, getMedical, updateMedical, deleteMedical }
