import axios from './axiosInstance'

export async function createOrder(data){ return (await axios.post('/api/orders', data)).data }
export async function listOrders(params){ return (await axios.get('/api/orders', { params })).data }
export async function updateOrderStatus(id, status){ return (await axios.patch(`/api/orders/${id}/status`, { status })).data }
export async function updateFulfillmentStatus(id, fulfillmentStatus, note){ return (await axios.patch(`/api/orders/${id}/fulfillment`, { fulfillmentStatus, note })).data }
export async function listFulfillmentEvents(id){ return (await axios.get(`/api/orders/${id}/fulfillment-events`)).data }

export default { createOrder, listOrders, updateOrderStatus, updateFulfillmentStatus, listFulfillmentEvents }
