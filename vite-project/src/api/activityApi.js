import axios from './axiosInstance'

export async function createActivity(data){ return (await axios.post('/api/activities', data)).data }
export async function listActivities(params){ return (await axios.get('/api/activities', { params })).data }

export default { createActivity, listActivities }