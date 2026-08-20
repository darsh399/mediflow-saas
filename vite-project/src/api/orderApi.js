import axios from './axiosInstance'

export async function createOrder(data){ return (await axios.post('/api/orders', data)).data }
export async function listOrders(){ return (await axios.get('/api/orders')).data }
export async function updateOrderStatus(id, status){ return (await axios.patch(`/api/orders/${id}/status`, { status })).data }

export default { createOrder, listOrders, updateOrderStatus }
