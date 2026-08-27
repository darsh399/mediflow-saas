import axios from './axiosInstance'

export async function listSales(params) {
  return (await axios.get('/api/sales', { params })).data
}

export async function getSale(id) {
  return (await axios.get(`/api/sales/${id}`)).data
}

export async function createSale(payload) {
  return (await axios.post('/api/sales', payload)).data
}

export async function deleteSale(id) {
  return (await axios.delete(`/api/sales/${id}`)).data
}

export default { listSales, getSale, createSale, deleteSale }
