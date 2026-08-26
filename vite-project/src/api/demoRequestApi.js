import axios from './axiosInstance'

export async function createDemoRequest(data) {
  const resp = await axios.post('/api/demo-requests', data)
  return resp.data
}

export default { createDemoRequest }
