import axios from './axiosInstance'

export async function applyLeave(data){
  const resp = await axios.post('/api/leaves', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
  return resp.data
}

export async function listLeaves(params, config){
  const resp = await axios.get('/api/leaves', { params, ...config })
  return resp.data
}

export async function listMyLeaves(params){
  const resp = await axios.get('/api/leaves', { params: { ...(params || {}), mine: true } })
  return resp.data
}

export async function reviewLeave(id, action){
  const resp = await axios.post(`/api/leaves/${id}/review`, typeof action === 'string' ? { action } : action)
  return resp.data
}

export async function getPolicy(){ return (await axios.get('/api/leaves/policy')).data }
export async function updatePolicy(leaveTypes){ return (await axios.patch('/api/leaves/policy', { leaveTypes })).data }
export async function getMyBalances(){ return (await axios.get('/api/leaves/balances/me')).data }
export async function getLeaveHistory(id){ return (await axios.get(`/api/leaves/${id}/history`)).data }
export async function exportLeaves(params){ return (await axios.get('/api/leaves/export', { params, responseType: 'blob' })).data }

export default { applyLeave, listLeaves, listMyLeaves, reviewLeave, getPolicy, updatePolicy, getMyBalances, getLeaveHistory, exportLeaves }
