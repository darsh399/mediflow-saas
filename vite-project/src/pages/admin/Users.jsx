import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUsers, searchUsers, deleteUser, fetchUser } from '../../redux/slices/userSlice'
import { Link } from 'react-router-dom'

const Users = ()=>{
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.users)
  const [q, setQ] = useState('')

  useEffect(()=>{ dispatch(fetchUsers()) }, [dispatch])

  const doSearch = ()=>{
    dispatch(searchUsers({ name: q }))
  }

  const handleDelete = (id)=>{ if(!confirm('Delete user?')) return; dispatch(deleteUser(id)) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Users</h2>
        <Link className="btn btn-primary" to="/admin/users/add">Add Employee</Link>
      </div>

      <div className="input-group mb-3" style={{maxWidth:480}}>
        <input className="form-control" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name" />
        <button className="btn btn-outline-secondary" onClick={doSearch}>Search</button>
      </div>

      {loading && <div className="alert alert-info">Loading users...</div>}
      {error && <div className="alert alert-danger">{error.message||JSON.stringify(error)}</div>}
      {!loading && items.length === 0 && <div className="alert alert-warning">No users found.</div>}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(u=> (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <Link to={`/admin/users/${u._id}`} className="btn btn-sm btn-outline-primary me-2">View</Link>
                  <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
