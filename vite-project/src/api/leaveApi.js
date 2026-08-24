import axios from './axiosInstance'

export async function applyLeave(data){
  const resp = await axios.post('/api/leaves', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
  return resp.data
}

export async function listLeaves(){
  const resp = await axios.get('/api/leaves')
  return resp.data
}

export async function listMyLeaves(){
  const resp = await axios.get('/api/leaves?mine=true')
  return resp.data
}

export async function reviewLeave(id, action){
  const resp = await axios.post(`/api/leaves/${id}/review`, { action })
  return resp.data
}

export default { applyLeave, listLeaves, listMyLeaves, reviewLeave }
