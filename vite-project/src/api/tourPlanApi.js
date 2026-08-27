import axios from './axiosInstance'

export async function listTourPlans(params) {
  return (await axios.get('/api/tour-plans', { params })).data
}

export async function getTourPlan(id) {
  return (await axios.get(`/api/tour-plans/${id}`)).data
}

export async function createTourPlan(payload) {
  return (await axios.post('/api/tour-plans', payload)).data
}

export async function updateTourPlan(id, payload) {
  return (await axios.patch(`/api/tour-plans/${id}`, payload)).data
}

export async function submitTourPlan(id) {
  return (await axios.post(`/api/tour-plans/${id}/submit`)).data
}

export async function reviewTourPlan(id, payload) {
  return (await axios.post(`/api/tour-plans/${id}/review`, payload)).data
}

export async function deleteTourPlan(id) {
  return (await axios.delete(`/api/tour-plans/${id}`)).data
}

export async function getDoctorCoverage(params) {
  return (await axios.get('/api/visits/coverage', { params })).data
}

export default {
  listTourPlans,
  getTourPlan,
  createTourPlan,
  updateTourPlan,
  submitTourPlan,
  reviewTourPlan,
  deleteTourPlan,
  getDoctorCoverage,
}
