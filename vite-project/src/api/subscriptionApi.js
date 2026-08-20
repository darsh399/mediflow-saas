import axios from './axiosInstance'

export async function createSubscription(data){
  const resp = await axios.post('/api/subscriptions', data)
  return resp.data
}

export async function getSubscription(companyId){
  const resp = await axios.get(`/api/subscriptions/${companyId}`)
  return resp.data
}

export default { createSubscription, getSubscription }
