import { useEffect, useState } from 'react'
import projectApi from '../../api/projectApi'
import userApi from '../../api/userApi'
import { PageContainer, PageHeader } from '../../components/ui'

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

  const statusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'primary'
      case 'COMPLETED': return 'success'
      case 'ARCHIVED': return 'secondary'
      default: return 'warning'
    }
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="People" title="Projects" description="Create and track projects assigned to your team." />

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-header bg-white border-0 p-4">
          <h5 className="fw-bold mb-1">Create Project</h5>
          <p className="text-muted small mb-0">Start a new project and assign a manager.</p>
        </div>
        <div className="card-body p-4">
          <form className="row g-3 align-items-end" onSubmit={create}>
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
            <div className="col-md-3">
              <button className="btn btn-primary w-100 rounded-3 fw-semibold" type="submit">
                <i className="bi bi-plus-lg me-1"></i>
                Create project
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-0 p-4">
          <h5 className="fw-bold mb-1">All Projects</h5>
          <p className="text-muted small mb-0">{projects.length} project{projects.length === 1 ? '' : 's'}</p>
        </div>
        {!projects.length ? (
          <div className="card-body text-center py-5">
            <i className="bi bi-kanban text-muted fs-1"></i>
            <h6 className="fw-bold mt-3 mb-1">No projects found</h6>
            <p className="text-muted mb-0">Create your first project above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="border-bottom">
                  <th className="py-3 px-4 text-muted small text-uppercase">Name</th>
                  <th className="py-3 text-muted small text-uppercase">Manager</th>
                  <th className="py-3 text-muted small text-uppercase">Status</th>
                  <th className="py-3 text-muted small text-uppercase">Update</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project._id}>
                    <td className="py-3 px-4">
                      <div className="fw-semibold">{project.name}</div>
                      {project.description && <div className="small text-muted">{project.description}</div>}
                    </td>
                    <td className="py-3">{project.managerId?.name || '-'}</td>
                    <td className="py-3">
                      <span className={`badge rounded-pill bg-${statusColor(project.status)}-subtle text-${statusColor(project.status)}-emphasis px-3 py-2`}>
                        {project.status}
                      </span>
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
    </PageContainer>
  )
}

export default Projects
