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
      const [projectResponse, userResponse] = await Promise.all([projectApi.listProjects(), userApi.listUsers()])
      setProjects(projectResponse.projects || [])
      setUsers(userResponse.users || [])
    } catch (err) { setError(err?.response?.data?.message || 'Unable to load projects') }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([projectApi.listProjects(), userApi.listUsers()]).then(([projectResponse, userResponse]) => {
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

  return <div>
    <h2>Projects</h2>
    {error && <div className="alert alert-danger">{error}</div>}
    <form className="row g-2 mb-4" onSubmit={create}>
      <div className="col-md-3"><input className="form-control" placeholder="Project name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></div>
      <div className="col-md-3"><input className="form-control" placeholder="Description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></div>
      <div className="col-md-3"><select className="form-select" value={form.managerId} onChange={event => setForm({ ...form, managerId: event.target.value })}><option value="">Project manager</option>{users.filter(user => ['manager', 'project_manager'].includes(user.role)).map(user => <option key={user._id} value={user._id}>{user.name}</option>)}</select></div>
      <div className="col-md-3"><button className="btn btn-primary">Create project</button></div>
    </form>
    {!projects.length && <div className="alert alert-info">No projects found.</div>}
    <div className="table-responsive"><table className="table table-striped"><thead><tr><th>Name</th><th>Manager</th><th>Status</th><th>Action</th></tr></thead><tbody>{projects.map(project => <tr key={project._id}><td>{project.name}<div className="small text-muted">{project.description}</div></td><td>{project.managerId?.name || '-'}</td><td>{project.status}</td><td><select className="form-select form-select-sm" value={project.status} onChange={event => updateStatus(project._id, event.target.value)}><option>PLANNED</option><option>ACTIVE</option><option>COMPLETED</option><option>ARCHIVED</option></select></td></tr>)}</tbody></table></div>
  </div>
}

export default Projects
