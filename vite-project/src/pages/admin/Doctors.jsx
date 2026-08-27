import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDoctors, deleteDoctor } from '../../redux/slices/doctorSlice'
import { Link } from 'react-router-dom'
import SearchBar from '../../components/SearchBar'
import AssignVisitModal from '../../components/AssignVisitModal'
import { PageHeader, StatCard, EmptyState } from '../../components/ui'

const ASSIGN_ROLES = ['admin', 'company_owner', 'hr_manager', 'manager', 'superadmin', 'super_admin']

function formatDateOfBirth(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB')
}

const Doctors = () => {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.doctors)
  const role = useSelector((s) => s.auth.user?.role)
  const canAssign = ASSIGN_ROLES.includes(role)
  const [refreshKey, setRefreshKey] = useState(0)
  const [q, setQ] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [territoryFilter, setTerritoryFilter] = useState('')
  const [assignTarget, setAssignTarget] = useState(null)

  useEffect(() => {
    dispatch(fetchDoctors())
  }, [dispatch, refreshKey])

  const handleDelete = (id) => {
    if (!confirm('Delete this doctor?')) return
    dispatch(deleteDoctor(id)).then(() => setRefreshKey(k => k + 1))
  }

  const uniqueValues = (field) => Array.from(new Set(items.map(d => d[field]).filter(Boolean))).sort()
  const cityOptions = useMemo(() => uniqueValues('city'), [items])
  const stateOptions = useMemo(() => uniqueValues('state'), [items])
  const districtOptions = useMemo(() => uniqueValues('district'), [items])
  const territoryOptions = useMemo(
    () => Array.from(new Map(items.filter(d => d.territoryId).map(d => [d.territoryId._id, d.territoryId.name])).entries()),
    [items]
  )

  const filteredDoctors = items.filter(d =>
    (d.name?.toLowerCase().includes(q.toLowerCase())) &&
    (!cityFilter || d.city === cityFilter) &&
    (!stateFilter || d.state === stateFilter) &&
    (!districtFilter || d.district === districtFilter) &&
    (!territoryFilter
      || (territoryFilter === '__none__' ? !d.territoryId : d.territoryId?._id === territoryFilter))
  )

  const clearLocationFilters = () => {
    setCityFilter('')
    setStateFilter('')
    setDistrictFilter('')
    setTerritoryFilter('')
  }

  return (
    <div className="container-fluid py-4">

      <PageHeader
        eyebrow="Field Operations"
        title="Doctors"
        description="Manage doctors and their clinic information."
        actions={
          <Link
            className="btn btn-primary px-4 py-2 rounded-3 fw-semibold"
            to="/doctors/add"
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add Doctor
          </Link>
        }
      />

      <div className="row g-3 mb-4">

        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Total Doctors"
            value={items.length}
            icon="bi-people"
            iconBg="var(--mf-color-primary-subtle)"
            iconColor="var(--mf-color-primary)"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Showing"
            value={filteredDoctors.length}
            icon="bi-search"
            iconBg="var(--mf-color-success-subtle)"
            iconColor="var(--mf-color-success)"
          />
        </div>

      </div>

      <div className="card border-0 shadow-sm rounded-4">

        <div className="card-body p-4">

          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

            <div>
              <h5 className="fw-bold mb-1">
                Doctor Directory
              </h5>

              <p className="text-muted small mb-0">
                Search and manage registered doctors.
              </p>
            </div>

            <div className="search-bar-wrap">
              <SearchBar
                value={q}
                onChange={setQ}
                placeholder="Search doctors by name"
              />
            </div>

          </div>

          <div className="row g-3 mb-4">
            <div className="col-sm-3">
              <label className="form-label small fw-semibold text-muted mb-1">Territory</label>
              <select className="form-select form-select-sm" value={territoryFilter} onChange={e => setTerritoryFilter(e.target.value)}>
                <option value="">All Territories</option>
                <option value="__none__">Unassigned</option>
                {territoryOptions.map(([tId, tName]) => <option key={tId} value={tId}>{tName}</option>)}
              </select>
            </div>
            <div className="col-sm-3">
              <label className="form-label small fw-semibold text-muted mb-1">City</label>
              <select className="form-select form-select-sm" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                <option value="">All Cities</option>
                {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div className="col-sm-3">
              <label className="form-label small fw-semibold text-muted mb-1">District</label>
              <select className="form-select form-select-sm" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
                <option value="">All Districts</option>
                {districtOptions.map(district => <option key={district} value={district}>{district}</option>)}
              </select>
            </div>
            <div className="col-sm-3">
              <label className="form-label small fw-semibold text-muted mb-1">State</label>
              <select className="form-select form-select-sm" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                <option value="">All States</option>
                {stateOptions.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            {(cityFilter || stateFilter || districtFilter || territoryFilter) && (
              <div className="col-12">
                <button type="button" className="btn btn-link btn-sm px-0" onClick={clearLocationFilters}>
                  <i className="bi bi-x-circle me-1"></i>Clear location filters
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <div className="text-muted">
                Loading doctors...
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger border-0 rounded-3 d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>

              <div>
                {error.message || JSON.stringify(error)}
              </div>
            </div>
          )}

          {!loading && !error && filteredDoctors.length === 0 && (
            <EmptyState
              icon="bi-person-x"
              title="No doctors found"
              description={
                q
                  ? 'Try searching with a different doctor name.'
                  : 'No doctors have been added yet.'
              }
              action={
                !q && (
                  <Link
                    to="/doctors/add"
                    className="btn btn-primary rounded-3"
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Your First Doctor
                  </Link>
                )
              }
            />
          )}

          {!loading && filteredDoctors.length > 0 && (
            <div className="table-responsive">

              <table className="table align-middle mb-0 doctors-table">

                <thead>
                  <tr className="border-bottom">

                    <th className="py-3 text-muted small text-uppercase">
                      Doctor
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Clinic
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Specialty
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Location
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Territory
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Phone
                    </th>

                    <th className="py-3 text-muted small text-uppercase">
                      Date of Birth
                    </th>

                    <th className="py-3 text-muted small text-uppercase text-end">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor._id}>

                      <td className="py-3">

                        <div className="d-flex align-items-center gap-3">

                          <div
                            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: '44px',
                              height: '44px',
                              minWidth: '44px'
                            }}
                          >
                            {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                          </div>

                          <div>
                            <div className="fw-semibold">
                              {doctor.name}
                            </div>

                            <small className="text-muted">
                              Doctor
                            </small>
                          </div>

                        </div>

                      </td>

                      <td className="py-3">

                        <div className="d-flex align-items-center gap-2">

                          <i className="bi bi-building text-primary"></i>

                          <span>
                            {doctor.clinicName || 'N/A'}
                          </span>

                        </div>

                      </td>

                      <td className="py-3">

                        {doctor.specialty ? (
                          <span className="badge bg-info bg-opacity-10 text-info-emphasis rounded-pill px-3 py-2">
                            {doctor.specialty}
                          </span>
                        ) : (
                          <span className="text-muted">
                            N/A
                          </span>
                        )}

                      </td>

                      <td className="py-3">
                        {doctor.city || doctor.district || doctor.state ? (
                          <span className="small">
                            {[doctor.city, doctor.district, doctor.state].filter(Boolean).join(', ')}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>

                      <td className="py-3">
                        {doctor.territoryId ? (
                          <span className="badge bg-primary bg-opacity-10 text-primary-emphasis rounded-pill px-3 py-2">
                            {doctor.territoryId.name}
                          </span>
                        ) : (
                          <span className="text-muted small">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3">

                        {doctor.phone ? (
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-telephone text-success"></i>
                            <span>{doctor.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted">
                            N/A
                          </span>
                        )}

                      </td>

                      <td className="py-3">
                        {formatDateOfBirth(doctor.dateOfBirth)}
                      </td>

                      <td className="py-3 text-end">

                        <div className="d-flex justify-content-end gap-2">

                          <Link
                            to={`${doctor._id}`}
                            className="btn btn-sm btn-outline-primary rounded-3 px-3"
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </Link>

                          {canAssign && (
                            <button
                              className="btn btn-sm btn-outline-success rounded-3 px-3"
                              onClick={() => setAssignTarget(doctor)}
                            >
                              <i className="bi bi-person-check me-1"></i>
                              Assign
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-outline-danger rounded-3 px-3"
                            onClick={() => handleDelete(doctor._id)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {assignTarget && (
        <AssignVisitModal
          doctorId={assignTarget._id}
          targetName={assignTarget.name}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => alert(`Visit to ${assignTarget.name} assigned successfully.`)}
        />
      )}

      <style>
        {`
          .card {
            transition: all 0.25s ease;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .table tbody tr {
            transition: background-color 0.2s ease;
          }

          .table tbody tr:hover {
            background-color: rgba(37, 99, 235, 0.035);
          }

          .btn {
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            /* Needs to out-specificity styles/ui-system.css's
               .table-responsive > .table min-width rule (0,2,0),
               otherwise this override is silently ignored. */
            .table-responsive > .table.doctors-table {
              min-width: 850px;
            }
          }
        `}
      </style>

    </div>
  )
}

export default Doctors