import axios from './axiosInstance'

export async function listProducts(params){ return (await axios.get('/api/products', { params })).data }
export async function createProduct(data){ return (await axios.post('/api/products', data)).data }
export async function updateProduct(id, data){ return (await axios.put(`/api/products/${id}`, data)).data }

export default { listProducts, createProduct, updateProduct }
