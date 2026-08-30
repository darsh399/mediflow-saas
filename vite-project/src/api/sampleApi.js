import axios from './axiosInstance'

export const listItems = (params) => axios.get('/api/samples/items', { params }).then((r) => r.data)
export const createItem = (payload) => axios.post('/api/samples/items', payload).then((r) => r.data)
export const updateItem = (id, payload) => axios.patch(`/api/samples/items/${id}`, payload).then((r) => r.data)
export const getBalances = (params) => axios.get('/api/samples/balances', { params }).then((r) => r.data)
export const listTransactions = (params) => axios.get('/api/samples/transactions', { params }).then((r) => r.data)
export const issueStock = (payload) => axios.post('/api/samples/issue', payload).then((r) => r.data)
export const recordGiven = (payload) => axios.post('/api/samples/given', payload).then((r) => r.data)
export const recordReturn = (payload) => axios.post('/api/samples/return', payload).then((r) => r.data)
export const adjustStock = (payload) => axios.post('/api/samples/adjust', payload).then((r) => r.data)

export default { listItems, createItem, updateItem, getBalances, listTransactions, issueStock, recordGiven, recordReturn, adjustStock }
