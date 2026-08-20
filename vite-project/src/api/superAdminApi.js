import axios from './axiosInstance'

export async function login(payload){
  const resp = await axios.post('/api/superadmin/login', payload)
  return resp.data
}

export async function dashboard(){
  const resp = await axios.get('/api/superadmin/dashboard')
  return resp.data
}

export async function createCompany(payload){
  const resp = await axios.post('/api/superadmin/companies', payload)
  return resp.data
}

export async function getCompany(id){
  const resp = await axios.get(`/api/superadmin/companies/${id}`)
  return resp.data
}

export async function deleteCompany(id){
  const resp = await axios.delete(`/api/superadmin/companies/${id}`)
  return resp.data
}
export async function updateCompanyStatus(id, payload){
  const resp = await axios.patch(`/api/superadmin/companies/${id}/status`, payload)
  return resp.data
}

export default { login, dashboard, createCompany, updateCompanyStatus, getCompany, deleteCompany }
