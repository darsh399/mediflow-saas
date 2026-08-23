import axios from './axiosInstance'

export async function createDoctor(payload){
  const resp = await axios.post('/api/doctors', payload)
  return resp.data
}

export async function listDoctors(){
  const resp = await axios.get('/api/doctors')
  console.log('get doctors data', resp.data)
  return resp.data
}

export async function getDoctor(id){
  const resp = await axios.get(`/api/doctors/${id}`)
  return resp.data
}

export async function updateDoctor(id, payload){
  const resp = await axios.put(`/api/doctors/${id}`, payload)
  return resp.data
}

export async function deleteDoctor(id){
  const resp = await axios.delete(`/api/doctors/${id}`)
  return resp.data
}

export default { createDoctor, listDoctors, getDoctor, updateDoctor, deleteDoctor }
