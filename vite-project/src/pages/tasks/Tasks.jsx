import { useEffect, useState } from 'react'
import taskApi from '../../api/taskApi'
import userApi from '../../api/userApi'

const Tasks = () => {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '' })
  const [error, setError] = useState('')
  const load = async () => { try { const [taskResponse, userResponse] = await Promise.all([taskApi.listTasks(), userApi.listUsers()]); setTasks(taskResponse.tasks || []); setUsers(userResponse.users || []) } catch (err) { setError(err?.response?.data?.message || 'Unable to load tasks') } }
  useEffect(() => {
    let cancelled = false
    Promise.all([taskApi.listTasks(), userApi.listUsers()]).then(([taskResponse, userResponse]) => {
      if (cancelled) return
      setTasks(taskResponse.tasks || [])
      setUsers(userResponse.users || [])
    }).catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Unable to load tasks') })
    return () => { cancelled = true }
  }, [])
  const create = async event => { event.preventDefault(); try { await taskApi.createTask(form); setForm({ title: '', description: '', assignedTo: '', dueDate: '' }); load() } catch (err) { setError(err?.response?.data?.message || 'Unable to create task') } }
  const update = async (id, status) => { try { await taskApi.updateTask(id, { status }); load() } catch (err) { setError(err?.response?.data?.message || 'Unable to update task') } }
  return <div><h2>Tasks</h2>{error && <div className="alert alert-danger">{error}</div>}<form className="row g-2 mb-4" onSubmit={create}><div className="col-md-3"><input className="form-control" placeholder="Title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required /></div><div className="col-md-3"><input className="form-control" placeholder="Description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></div><div className="col-md-3"><select className="form-select" value={form.assignedTo} onChange={event => setForm({ ...form, assignedTo: event.target.value })} required><option value="">Assign to...</option>{users.map(user => <option key={user._id} value={user._id}>{user.name} ({user.role})</option>)}</select></div><div className="col-md-3"><button className="btn btn-primary">Create task</button></div></form><div className="table-responsive"><table className="table"><thead><tr><th>Title</th><th>Assigned to</th><th>Status</th><th>Action</th></tr></thead><tbody>{tasks.map(task => <tr key={task._id}><td>{task.title}<div className="small text-muted">{task.description}</div></td><td>{task.assignedTo?.name || '-'}</td><td>{task.status}</td><td><select className="form-select form-select-sm" value={task.status} onChange={event => update(task._id, event.target.value)}><option>TODO</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>CANCELLED</option></select></td></tr>)}</tbody></table></div></div>
}
export default Tasks
