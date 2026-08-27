import axios from './axiosInstance'

export async function getOrgChart() {
  const response = await axios.get('/api/organization/chart')
  return response.data
}

export async function listUnits(params) {
  const response = await axios.get('/api/organization', { params })
  return response.data
}

export default { getOrgChart, listUnits }
