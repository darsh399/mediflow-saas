import axios from './axiosInstance'

export async function createProject(data){ return (await axios.post('/api/projects', data)).data }
export async function listProjects(){ return (await axios.get('/api/projects')).data }
export async function updateProject(id, data){ return (await axios.patch(`/api/projects/${id}`, data)).data }

export default { createProject, listProjects, updateProject }