import axios from './axiosInstance'

export async function listNotifications(){ return (await axios.get('/api/notifications')).data }
export async function markNotificationRead(id){ return (await axios.patch(`/api/notifications/${id}/read`)).data }
export async function markAllNotificationsRead(){ return (await axios.patch('/api/notifications/read-all')).data }
export async function sendCompanyMessage(payload){
  return (await axios.post('/api/notifications/send', payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}

export default { listNotifications, markNotificationRead, markAllNotificationsRead, sendCompanyMessage }
