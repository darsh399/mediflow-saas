import axios from './axiosInstance'

export async function createCompany(data){
  const resp = await axios.post('/api/companies', data)
  return resp.data
}

export async function getCompany(id){
  const resp = await axios.get(`/api/companies/${id}`)
  return resp.data
}

export default { createCompany, getCompany }
