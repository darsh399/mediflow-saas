import axios from './axiosInstance'

export async function listProducts(params) {
  const resp = await axios.get('/api/company-products', { params })
  return resp.data
}

export async function getProduct(id) {
  const resp = await axios.get(`/api/company-products/${id}`)
  return resp.data
}

export async function createProduct(formData) {
  const resp = await axios.post('/api/company-products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function updateProduct(id, formData) {
  const resp = await axios.put(`/api/company-products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function updateProductStatus(id, status) {
  const resp = await axios.patch(`/api/company-products/${id}/status`, { status })
  return resp.data
}

export async function deleteProduct(id) {
  const resp = await axios.delete(`/api/company-products/${id}`)
  return resp.data
}

export default { listProducts, getProduct, createProduct, updateProduct, updateProductStatus, deleteProduct }
