import axios from './axiosInstance'

export async function updateCrm(doctorId, payload) {
  return (await axios.patch(`/api/doctors/${doctorId}/crm`, payload)).data
}

export async function getSummary(doctorId) {
  return (await axios.get(`/api/doctors/${doctorId}/summary`)).data
}

export async function getTimeline(doctorId) {
  return (await axios.get(`/api/doctors/${doctorId}/timeline`)).data
}

export async function listInteractions(doctorId) {
  return (await axios.get(`/api/doctors/${doctorId}/interactions`)).data
}

export async function createInteraction(doctorId, payload) {
  return (await axios.post(`/api/doctors/${doctorId}/interactions`, payload)).data
}

export async function deleteInteraction(doctorId, interactionId) {
  return (await axios.delete(`/api/doctors/${doctorId}/interactions/${interactionId}`)).data
}

export async function listEngagement(params) {
  return (await axios.get('/api/doctors/engagement', { params })).data
}

export default {
  updateCrm, getSummary, getTimeline, listInteractions, createInteraction, deleteInteraction, listEngagement,
}
