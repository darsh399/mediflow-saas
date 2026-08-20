import axios from './axiosInstance'

export async function listNotifications(){ return (await axios.get('/api/notifications')).data }
export async function markNotificationRead(id){ return (await axios.patch(`/api/notifications/${id}/read`)).data }

export default { listNotifications, markNotificationRead }
