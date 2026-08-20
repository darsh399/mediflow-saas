import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMedicals, deleteMedical } from '../../redux/slices/medicalSlice'
import { Link } from 'react-router-dom'
import SearchBar from '../../components/SearchBar'

const Medicals = () => {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.medicals)
  const [refreshKey, setRefreshKey] = useState(0)
  const [q, setQ] = useState('')

  useEffect(()=>{
    dispatch(fetchMedicals())
  }, [dispatch, refreshKey])

  const handleDelete = (id)=>{
    if(!confirm('Delete this medical/shop?')) return
    dispatch(deleteMedical(id)).then(()=> setRefreshKey(k => k+1))
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Medicals / Shops</h2>
        <Link className="btn btn-primary" to="/admin/medicals/add">Add Medical</Link>
      </div>

      <SearchBar value={q} onChange={setQ} placeholder="Search medicals by name" />
      {loading && <div className="alert alert-info">Loading medicals...</div>}
      {error && <div className="alert alert-danger">{error.message || JSON.stringify(error)}</div>}
      {!loading && items.filter(d=> d.name.toLowerCase().includes(q.toLowerCase())).length === 0 && <div className="alert alert-warning">No medicals found.</div>}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>City</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.filter(d=> d.name.toLowerCase().includes(q.toLowerCase())).map(d=> (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.contactPerson}</td>
                <td>{d.city}</td>
                <td>{d.mobile}</td>
                <td>
                  <Link to={`/admin/medicals/${d._id}`} className="btn btn-sm btn-outline-primary me-2">View</Link>
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

export default Medicals
