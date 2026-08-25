import { useEffect, useState } from 'react'
import projectApi from '../../api/projectApi'
import userApi from '../../api/userApi'

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', description: '', managerId: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [projectResponse, userResponse] = await Promise.all([projectApi.listProjects(), userApi.listColleagues()])
      setProjects(projectResponse.projects || [])
      setUsers(userResponse.users || [])
    } catch (err) { setError(err?.response?.data?.message || 'Unable to load projects') }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([projectApi.listProjects(), userApi.listColleagues()]).then(([projectResponse, userResponse]) => {
      if (cancelled) return
      setProjects(projectResponse.projects || [])
      setUsers(userResponse.users || [])
    }).catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Unable to load projects') })
    return () => { cancelled = true }
  }, [])

  const create = async event => {
    event.preventDefault()
    try {
      await projectApi.createProject(form)
      setForm({ name: '', description: '', managerId: '' })
      load()
    } catch (err) { setError(err?.response?.data?.message || 'Unable to create project') }
  }

  const updateStatus = async (id, status) => {
    try { await projectApi.updateProject(id, { status }); load() } catch (err) { setError(err?.response?.data?.message || 'Unable to update project') }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACTIVE': return { backgroundColor: '#e8f8ef', color: '#198754' }
      case 'COMPLETED': return { backgroundColor: '#e5f0ff', color: '#0d6efd' }
      case 'ARCHIVED': return { backgroundColor: '#f1f3f5', color: '#6c757d' }
      default: return { backgroundColor: '#fff4e5', color: '#fd7e14' }
    }
  }

  return (
    <div className="container-fluid py-4">

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '52px', height: '52px' }}
          >
            <i className="bi bi-kanban-fill fs-4"></i>
          </div>
          <div>
            <h2 className="fw-bold mb-0">Projects</h2>
            <p className="text-muted mb-0">Create and track your team's projects.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-header bg-white border-0 p-4 pb-2">
          <h5 className="fw-bold mb-1">Create Project</h5>
          <p className="text-muted small mb-0">Set up a new project and assign a project manager.</p>
        </div>
        <div className="card-body p-4">
          <form className="row g-3" onSubmit={create}>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Project Name</label>
              <input className="form-control" placeholder="Project name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Description</label>
              <input className="form-control" placeholder="Description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Project Manager</label>
              <select className="form-select" value={form.managerId} onChange={event => setForm({ ...form, managerId: event.target.value })}>
                <option value="">Select manager</option>
                {users.filter(user => ['manager', 'project_manager'].includes(user.role)).map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary w-100 rounded-3">
                <i className="bi bi-plus-lg me-1"></i>
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-0 p-4">
          <h5 className="fw-bold mb-0">All Projects</h5>
        </div>
        {!projects.length ? (
          <div className="text-center py-5">
            <i className="bi bi-kanban text-muted fs-1"></i>
            <h6 className="fw-bold mt-3">No projects found</h6>
            <p className="text-muted mb-0">Create your first project using the form above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: '#f8f9fc' }}>
                <tr>
                  <th className="px-4 py-3 border-0">Name</th>
                  <th className="py-3 border-0">Manager</th>
                  <th className="py-3 border-0">Status</th>
                  <th className="py-3 border-0">Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project._id}>
                    <td className="px-4 py-3">
                      <div className="fw-semibold">{project.name}</div>
                      <div className="small text-muted">{project.description}</div>
                    </td>
                    <td className="py-3">{project.managerId?.name || '-'}</td>
                    <td className="py-3">
                      <span className="badge rounded-pill px-3 py-2" style={getStatusStyle(project.status)}>{project.status}</span>
                    </td>
                    <td className="py-3">
                      <select className="form-select form-select-sm" style={{ maxWidth: '160px' }} value={project.status} onChange={event => updateStatus(project._id, event.target.value)}>
                        <option>PLANNED</option>
                        <option>ACTIVE</option>
                        <option>COMPLETED</option>
                        <option>ARCHIVED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default Projects
