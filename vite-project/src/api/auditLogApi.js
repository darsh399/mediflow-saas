import axios from './axiosInstance'

export async function listAuditLogs(params) {
  const resp = await axios.get('/api/audit-logs', { params })
  return resp.data
}

export default { listAuditLogs }
