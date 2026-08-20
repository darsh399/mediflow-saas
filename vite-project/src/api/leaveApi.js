import axios from './axiosInstance'

export async function applyLeave(data){
  const resp = await axios.post('/api/leaves', data)
  return resp.data
}

export async function listLeaves(){
  const resp = await axios.get('/api/leaves')
  return resp.data
}

export async function reviewLeave(id, action){
  const resp = await axios.post(`/api/leaves/${id}/review`, { action })
  return resp.data
}

export default { applyLeave, listLeaves, reviewLeave }
