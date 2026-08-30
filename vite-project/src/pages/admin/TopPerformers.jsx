import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchTopPerformers } from '../../redux/slices/visitSlice'
import { PageContainer, PageHeader } from '../../components/ui'

const RANGE_OPTIONS = [
  ['TODAY', 'Today'],
  ['THIS_WEEK', 'This week'],
  ['THIS_MONTH', 'This month'],
  ['LAST_7_DAYS', 'Last 7 days'],
  ['LAST_MONTH', 'Last month'],
]

const MEDALS = ['🥇', '🥈', '🥉']

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-GB') : '-'
}

export default function TopPerformers() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, dateRange, loading, error } = useSelector((state) => state.visits.topPerformers)
  const [range, setRange] = useState('THIS_WEEK')
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    dispatch(fetchTopPerformers({ range, limit }))
  }, [dispatch, range, limit])

  const top3 = items.slice(0, 3)
  const rest = items.slice(3)

  return (
    <PageContainer>
      <PageHeader eyebrow="Field" title="Top Performers" description="Employees with the most completed work visits." />

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold" htmlFor="top-performer-range">Period</label>
              <select id="top-performer-range" className="form-select" value={range} onChange={(event) => setRange(event.target.value)}>
                {RANGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" htmlFor="top-performer-limit">Show top</label>
              <select id="top-performer-limit" className="form-select" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error.message || String(error)}</div>}
      {dateRange.startDate && <p className="text-muted small">Showing {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}</p>}

      {loading ? (
        <div className="alert alert-info">Loading top performers...</div>
      ) : items.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-trophy fs-1 text-primary" />
            <h5 className="fw-bold mt-3">No visits recorded in this period</h5>
            <p className="text-muted mb-0">Try a wider date range.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {top3.map((employee) => (
              <div className="col-md-4" key={employee._id}>
                <div className="card border-0 shadow-sm h-100 text-center">
                  <div className="card-body">
                    <div style={{ fontSize: '2.5rem' }}>{MEDALS[employee.rank - 1]}</div>
                    <h5 className="fw-bold mb-1">{employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown employee'}</h5>
                    <div className="text-muted small mb-3">{employee.employeeId || employee.email || '-'}</div>
                    <div className="d-flex justify-content-center gap-4">
                      <div>
                        <div className="fw-bold fs-4 text-success">{employee.completedCount}</div>
                        <div className="text-muted small">Completed</div>
                      </div>
                      <div>
                        <div className="fw-bold fs-4">{employee.visitCount}</div>
                        <div className="text-muted small">Total visits</div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-primary mt-3" onClick={() => navigate(`/admin/visits/${employee._id}`)}>View visits</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Employee</th>
                        <th>Employee ID</th>
                        <th>Completed</th>
                        <th>Total visits</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((employee) => (
                        <tr key={employee._id}>
                          <td>#{employee.rank}</td>
                          <td>
                            <div className="fw-semibold">{employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown employee'}</div>
                            <div className="small text-muted">{employee.email || '-'}</div>
                          </td>
                          <td>{employee.employeeId || '-'}</td>
                          <td>{employee.completedCount}</td>
                          <td>{employee.visitCount}</td>
                          <td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/admin/visits/${employee._id}`)}>View visits</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
