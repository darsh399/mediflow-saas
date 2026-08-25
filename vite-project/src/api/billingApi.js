import axios from './axiosInstance'

export async function getMySubscription() {
  const resp = await axios.get('/api/billing/my')
  return resp.data
}

export default { getMySubscription }
