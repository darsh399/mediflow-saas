import axios from './axiosInstance'

export async function getSettings() {
  return (await axios.get('/api/payroll/settings')).data
}
export async function updateSettings(payload) {
  return (await axios.put('/api/payroll/settings', payload)).data
}

export async function listRuns() {
  return (await axios.get('/api/payroll/runs')).data
}
export async function previewRun(params) {
  return (await axios.get('/api/payroll/runs/preview', { params })).data
}
export async function createRun(payload) {
  return (await axios.post('/api/payroll/runs', payload)).data
}
export async function getRun(id) {
  return (await axios.get(`/api/payroll/runs/${id}`)).data
}
export async function updateRun(id, payload) {
  return (await axios.patch(`/api/payroll/runs/${id}`, payload)).data
}
export async function recomputeRun(id) {
  return (await axios.post(`/api/payroll/runs/${id}/recompute`)).data
}
export async function approveRun(id) {
  return (await axios.post(`/api/payroll/runs/${id}/approve`)).data
}
export async function generateSlips(id) {
  return (await axios.post(`/api/payroll/runs/${id}/generate`)).data
}
export async function sendSlips(id) {
  return (await axios.post(`/api/payroll/runs/${id}/send`)).data
}
export async function markPaid(id) {
  return (await axios.post(`/api/payroll/runs/${id}/paid`)).data
}
export async function deleteRun(id) {
  return (await axios.delete(`/api/payroll/runs/${id}`)).data
}
export async function getBankAdvice(id) {
  return (await axios.get(`/api/payroll/runs/${id}/bank-advice`)).data
}
export async function getAnnualSummary(params) {
  return (await axios.get('/api/payroll/summary', { params })).data
}

export default {
  getSettings, updateSettings,
  listRuns, previewRun, createRun, getRun, updateRun, recomputeRun,
  approveRun, generateSlips, sendSlips, markPaid, deleteRun,
  getBankAdvice, getAnnualSummary,
}
