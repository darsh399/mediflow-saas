import axios from './axiosInstance'

export async function getReport(type, params) {
  return (await axios.get(`/api/reports/${type}`, { params })).data
}

export async function downloadReport(type, params) {
  return (await axios.get(`/api/reports/${type}`, { params: { ...params, format: 'csv' }, responseType: 'blob' })).data
}

export async function getReportEmployees() {
  return (await axios.get('/api/reports/employees')).data
}

export default { getReport, downloadReport, getReportEmployees }
