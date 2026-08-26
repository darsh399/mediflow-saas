import { useEffect, useState } from 'react'
import superAdminApi from '../../api/superAdminApi'
import BackButton from '../../components/BackButton'

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'CONVERTED', 'DISMISSED']

const STATUS_STYLES = {
  NEW: { backgroundColor: '#fff9e0', color: '#997404' },
  CONTACTED: { backgroundColor: '#e7f1ff', color: 'var(--mf-color-primary)' },
  CONVERTED: { backgroundColor: '#e8f8ef', color: '#198754' },
  DISMISSED: { backgroundColor: '#f1f3f5', color: '#6c757d' },
}
const statusStyle = status => STATUS_STYLES[status] || { backgroundColor: '#f1f3f5', color: '#6c757d' }

const fmtDate = d => (d ? new Date(d).toLocaleString() : '-')

const DemoRequests = () => {
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const response = await superAdminApi.listDemoRequests({ status: statusFilter || undefined, page, limit: 20 })
      setList(response.data || [])
      setPagination(response.pagination || {})
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, page])

  const changeStatus = async (id, status) => {
    try {
      setUpdatingId(id)
      await superAdminApi.updateDemoRequestStatus(id, status)
      await load()
    } catch (error) {
      console.error(error)
      window.alert(error?.response?.data?.message || 'Unable to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-body p-4 p-lg-5 text-white" style={{ background: 'linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)' }}>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
            <BackButton />
            <span className="opacity-75 small">SUPER ADMIN</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '55px', height: '55px' }}>
              <i className="bi bi-megaphone fs-3"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-0">Demo Requests</h2>
              <p className="mb-0 opacity-75">Leads submitted through the public Contact page.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-wrap gap-2 align-items-center">
          <label className="fw-semibold small me-2 mb-0">Status</label>
          <select className="form-select" style={{ maxWidth: 200 }} value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1) }}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(status => <option value={status} key={status}>{status}</option>)}
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: '#f8f9fc' }}>
                <tr>
                  <th className="px-4 py-3 border-0">Name / Company</th>
                  <th className="py-3 border-0">Contact</th>
                  <th className="py-3 border-0">Message</th>
                  <th className="py-3 border-0">Submitted</th>
                  <th className="py-3 border-0">Status</th>
                  <th className="py-3 border-0 pe-4">Update</th>
                </tr>
              </thead>
              <tbody>
                {list.length ? list.map(item => (
                  <tr key={item._id}>
                    <td className="px-4 py-3">
                      <div className="fw-semibold">{item.name}</div>
                      <div className="text-muted small">{item.companyName}</div>
                    </td>
                    <td className="py-3">
                      <div>{item.email}</div>
                      {item.phone && <div className="text-muted small">{item.phone}</div>}
                    </td>
                    <td className="py-3" style={{ maxWidth: 280 }}>
                      {item.subject && <div className="fw-semibold small">{item.subject}</div>}
                      <div className="text-muted small text-truncate" style={{ maxWidth: 260 }} title={item.message}>{item.message}</div>
                    </td>
                    <td className="py-3 small">{fmtDate(item.createdAt)}</td>
                    <td className="py-3">
                      <span className="badge rounded-pill px-3 py-2" style={statusStyle(item.status)}>{item.status}</span>
                    </td>
                    <td className="py-3 pe-4">
                      <select
                        className="form-select form-select-sm"
                        style={{ minWidth: 150 }}
                        value={item.status}
                        disabled={updatingId === item._id}
                        onChange={event => changeStatus(item._id, event.target.value)}
                      >
                        {STATUS_OPTIONS.map(status => <option value={status} key={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                )) : <tr><td colSpan="6" className="text-center text-muted py-5">No demo requests found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted small">{pagination.total} request(s)</span>
          <div className="btn-group">
            <button type="button" className="btn btn-outline-secondary" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>Previous</button>
            <span className="btn btn-outline-secondary disabled">{page} / {pagination.totalPages}</span>
            <button type="button" className="btn btn-outline-secondary" disabled={page >= pagination.totalPages || loading} onClick={() => setPage(value => value + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DemoRequests
