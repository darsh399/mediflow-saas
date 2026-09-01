import axios from './axiosInstance'

export async function getSummary(params) {
  return (await axios.get('/api/reports/analytics/summary', { params })).data
}

export default { getSummary }
