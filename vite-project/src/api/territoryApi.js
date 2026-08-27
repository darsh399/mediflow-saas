import axios from './axiosInstance'

export async function listTerritories(params) {
  const response = await axios.get('/api/territories', { params })
  return response.data
}

export async function getTerritory(id) {
  const response = await axios.get(`/api/territories/${id}`)
  return response.data
}

export async function createTerritory(payload) {
  const response = await axios.post('/api/territories', payload)
  return response.data
}

export async function updateTerritory(id, payload) {
  const response = await axios.patch(`/api/territories/${id}`, payload)
  return response.data
}

export async function deleteTerritory(id) {
  const response = await axios.delete(`/api/territories/${id}`)
  return response.data
}

export async function setTerritoryPlaces(id, payload) {
  const response = await axios.patch(`/api/territories/${id}/places`, payload)
  return response.data
}

export default { listTerritories, getTerritory, createTerritory, updateTerritory, deleteTerritory, setTerritoryPlaces }
