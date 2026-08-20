import axios from './axiosInstance'

export async function createTask(data){ return (await axios.post('/api/tasks', data)).data }
export async function listTasks(){ return (await axios.get('/api/tasks')).data }
export async function updateTask(id, data){ return (await axios.patch(`/api/tasks/${id}`, data)).data }

export default { createTask, listTasks, updateTask }
