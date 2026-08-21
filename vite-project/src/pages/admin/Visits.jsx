import { useEffect, useState } from 'react'
import visitApi from '../../api/visitApi'

const Visits = () => {
  const [visits, setVisits] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    visitApi.listVisits()
      .then(response => setVisits(response.visits || []))
      .catch(err => setError(err?.response?.data?.message || 'Unable to load visits'))
  }, [])

  return <div>
    <h2>Visits</h2>
    {error && <div className="alert alert-danger">{error}</div>}
    {!error && visits.length === 0 && <div className="alert alert-info">No visits recorded yet.</div>}
    <div className="table-responsive">
      <table className="table table-striped">
        <thead><tr><th>Date</th><th>Doctor</th><th>Employee</th><th>Status</th><th>Location</th></tr></thead>
        <tbody>{visits.map(visit => <tr key={visit._id}>
          <td>{visit.visitedAt ? new Date(visit.visitedAt).toLocaleString() : '-'}</td>
          <td>{visit.doctorId?.name || '-'}</td>
          <td>{visit.employeeId?.name || visit.createdBy?.name || '-'}</td>
          <td>{visit.status || '-'}</td>
          <td>{visit.locationVerified ? 'Verified' : 'Not verified'}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>
}

export default Visits
