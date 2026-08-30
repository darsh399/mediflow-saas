import axios from './axiosInstance'

export async function createDoctor(payload){
  const resp = await axios.post('/api/doctors', payload)
  return resp.data
}

export async function listDoctors(params){
  const resp = await axios.get('/api/doctors', { params })
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

// Fill in blanks on an existing doctor (Excel-imported records). Only writes
// fields that are currently empty; never overwrites.
export async function completeDoctor(id, payload){
  const resp = await axios.patch(`/api/doctors/${id}/complete`, payload)
  return resp.data
}

// Company Owner / HR Manager only (enforced on the backend too).
export async function importDoctors(file){
  const formData = new FormData()
  formData.append('file', file)
  const resp = await axios.post('/api/doctors/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return resp.data
}

export async function downloadDoctorTemplate(){
  const resp = await axios.get('/api/doctors/import/template', { responseType: 'blob' })
  return resp.data
}

export default { createDoctor, listDoctors, getDoctor, updateDoctor, completeDoctor, deleteDoctor, importDoctors, downloadDoctorTemplate }
