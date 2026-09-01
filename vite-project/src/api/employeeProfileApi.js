import axios from './axiosInstance'

export async function getMyProfile(){ return (await axios.get('/api/employee-profiles/me')).data }
export async function saveProfile(data){ return (await axios.put('/api/employee-profiles/me', data)).data }
export async function saveBankDetails(data){ return (await axios.put('/api/employee-profiles/me/bank-details', data)).data }
export async function submitProfile(){ return (await axios.post('/api/employee-profiles/me/submit')).data }
export async function uploadDocuments(formData){ return (await axios.post('/api/employee-profiles/me/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data }
export async function listProfiles(config){ return (await axios.get('/api/employee-profiles', config)).data }
export async function reviewProfile(id, data){ return (await axios.patch(`/api/employee-profiles/${id}/review`, data)).data }
export async function downloadDocument(storageName){
	const fileName = storageName.split('/').pop()
	return (await axios.get(`/api/employee-profiles/documents/${encodeURIComponent(fileName)}`, { responseType: 'blob' })).data
}
export async function verifyDocument(userId, documentId, verified){ return (await axios.patch(`/api/employee-profiles/documents/employee/${userId}/${documentId}/verify`, { verified })).data }
export async function requestDocumentReupload(userId, note){ return (await axios.post(`/api/employee-profiles/documents/employee/${userId}/request-reupload`, { note })).data }
export async function deleteDocument(userId, documentId){ return (await axios.delete(`/api/employee-profiles/documents/employee/${userId}/${documentId}`)).data }

export default { getMyProfile, saveProfile, saveBankDetails, submitProfile, uploadDocuments, listProfiles, reviewProfile, downloadDocument, verifyDocument, requestDocumentReupload, deleteDocument }
