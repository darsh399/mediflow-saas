import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDoctors, deleteDoctor } from '../../redux/slices/doctorSlice'
import { Link } from 'react-router-dom'
import SearchBar from '../../components/SearchBar'

const Doctors = () => {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.doctors)
  const [refreshKey, setRefreshKey] = useState(0)
  const [q, setQ] = useState('')

  useEffect(()=>{
    dispatch(fetchDoctors())
  }, [dispatch, refreshKey])

  const handleDelete = (id)=>{
    if(!confirm('Delete this doctor?')) return
    dispatch(deleteDoctor(id)).then(()=> setRefreshKey(k => k+1))
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Doctors</h2>
        <Link className="btn btn-primary" to="/admin/doctors/add">Add Doctor</Link>
      </div>

      <SearchBar value={q} onChange={setQ} placeholder="Search doctors by name" />
      {loading && <div className="alert alert-info">Loading doctors...</div>}
      {error && <div className="alert alert-danger">{error.message || JSON.stringify(error)}</div>}
      {!loading && items.filter(d=> d.name.toLowerCase().includes(q.toLowerCase())).length === 0 && <div className="alert alert-warning">No doctors found.</div>}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Clinic</th>
              <th>Specialty</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.filter(d=> d.name.toLowerCase().includes(q.toLowerCase())).map(d=> (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.clinicName}</td>
                <td>{d.specialty}</td>
                <td>{d.phone}</td>
                <td>
                  <Link to={`/admin/doctors/${d._id}`} className="btn btn-sm btn-outline-primary me-2">View</Link>
                  <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(d._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Doctors
