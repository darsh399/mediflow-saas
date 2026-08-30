import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDoctors, deleteDoctor } from '../../redux/slices/doctorSlice'
import { Link, useSearchParams } from 'react-router-dom'
import SearchBar from '../../components/SearchBar'
import AssignVisitModal from '../../components/AssignVisitModal'
import DoctorImportModal from '../../components/DoctorImportModal'
import { PageContainer, PageHeader, StatCard, FilterBar, DataTable, EmptyState } from '../../components/ui'

const ASSIGN_ROLES = ['admin', 'company_owner', 'hr_manager', 'manager', 'superadmin', 'super_admin']
const IMPORT_ROLES = ['admin', 'company_owner', 'hr_manager', 'superadmin', 'super_admin']

function formatDateOfBirth(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB')
}

const Doctors = () => {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector(s => s.doctors)
  const role = useSelector((s) => s.auth.user?.role)
  const canAssign = ASSIGN_ROLES.includes(role)
  const canImport = IMPORT_ROLES.includes(role)
  const [refreshKey, setRefreshKey] = useState(0)
  const [q, setQ] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [territoryFilter, setTerritoryFilter] = useState('')
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    dispatch(fetchDoctors())
  }, [dispatch, refreshKey])

  // The sidebar / deep links can point here with ?import=1 — open the modal
  // and strip the param so it doesn't reopen on refresh.
  useEffect(() => {
    if (searchParams.get('import') === '1' && canImport) {
      setShowImport(true)
      searchParams.delete('import')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canImport])

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

  const isIncomplete = (d) => d.completeness ? !d.completeness.complete : false
  const incompleteCount = items.filter(isIncomplete).length

  const filteredDoctors = items.filter(d =>
    (d.name?.toLowerCase().includes(q.toLowerCase())) &&
    (!cityFilter || d.city === cityFilter) &&
    (!stateFilter || d.state === stateFilter) &&
    (!districtFilter || d.district === districtFilter) &&
    (!territoryFilter
      || (territoryFilter === '__none__' ? !d.territoryId : d.territoryId?._id === territoryFilter)) &&
    (!incompleteOnly || isIncomplete(d))
  )

  const hasLocationFilters = cityFilter || stateFilter || districtFilter || territoryFilter
  const clearLocationFilters = () => {
    setCityFilter('')
    setStateFilter('')
    setDistrictFilter('')
    setTerritoryFilter('')
  }

  const columns = [
    {
      key: 'name',
      header: 'Doctor',
      render: (doctor) => (
        <div className="d-flex align-items-center gap-3">
          <span
            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: 40, height: 40 }}
          >
            {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
          </span>
          <div>
            <div className="fw-semibold d-flex align-items-center gap-2">
              <Link to={`${doctor._id}`} className="text-reset text-decoration-none">{doctor.name}</Link>
              {isIncomplete(doctor) && (
                <span className="mf-badge mf-badge--warning" title={`Missing: ${doctor.completeness.missing.join(', ')}`}>
                  <i className="bi bi-exclamation-triangle"></i> Incomplete
                </span>
              )}
            </div>
            <small className="text-muted">Doctor</small>
          </div>
        </div>
      ),
    },
    { key: 'clinicName', header: 'Clinic', render: (d) => d.clinicName || <span className="text-muted">—</span> },
    {
      key: 'specialty',
      header: 'Specialty',
      render: (d) => d.specialty
        ? <span className="mf-badge mf-badge--info">{d.specialty}</span>
        : <span className="text-muted">—</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (d) => {
        const parts = [d.city, d.district, d.state].filter(Boolean)
        return parts.length ? <span className="small">{parts.join(', ')}</span> : <span className="text-muted">—</span>
      },
    },
    {
      key: 'territory',
      header: 'Territory',
      render: (d) => d.territoryId
        ? <span className="mf-badge mf-badge--primary">{d.territoryId.name}</span>
        : <span className="text-muted small">Unassigned</span>,
    },
    { key: 'phone', header: 'Phone', render: (d) => d.phone || <span className="text-muted">—</span> },
    { key: 'dob', header: 'Date of Birth', render: (d) => formatDateOfBirth(d.dateOfBirth) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (doctor) => (
        <div className="d-flex justify-content-end gap-2">
          <Link to={`${doctor._id}`} className="btn btn-sm btn-outline-primary rounded-3">
            <i className="bi bi-eye me-1"></i> View
          </Link>
          {canAssign && (
            <button className="btn btn-sm btn-outline-success rounded-3" onClick={() => setAssignTarget(doctor)}>
              <i className="bi bi-person-check me-1"></i> Assign
            </button>
          )}
          <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(doctor._id)} aria-label="Delete doctor">
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Field"
        title="Doctors"
        description="Manage your doctor network, clinic details and territory coverage."
        actions={
          <>
            {canImport && (
              <button type="button" className="btn btn-outline-primary rounded-3 fw-semibold" onClick={() => setShowImport(true)}>
                <i className="bi bi-file-earmark-excel me-2"></i> Import Excel
              </button>
            )}
            <Link className="btn btn-primary rounded-3 fw-semibold" to="/doctors/add">
              <i className="bi bi-plus-lg me-2"></i> Add Doctor
            </Link>
          </>
        }
      />

      <div className="row g-3">
        <div className="col-6 col-xl-3">
          <StatCard label="Total Doctors" value={items.length} icon="bi-people" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="Showing" value={filteredDoctors.length} icon="bi-funnel"
            iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)"
          />
        </div>
        {incompleteCount > 0 && (
          <div className="col-6 col-xl-3">
            <button
              type="button"
              className="btn p-0 border-0 bg-transparent w-100 text-start"
              aria-pressed={incompleteOnly}
              onClick={() => setIncompleteOnly((value) => !value)}
            >
              <StatCard
                label={incompleteOnly ? 'Incomplete · filtering' : 'Incomplete details'}
                value={incompleteCount} icon="bi-exclamation-triangle"
                iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)"
              />
            </button>
          </div>
        )}
      </div>

      <FilterBar>
        <FilterBar.Field grow>
          <SearchBar value={q} onChange={setQ} placeholder="Search doctors by name" />
        </FilterBar.Field>
        <FilterBar.Field label="Territory" htmlFor="f-territory">
          <select id="f-territory" className="form-select form-select-sm" value={territoryFilter} onChange={e => setTerritoryFilter(e.target.value)}>
            <option value="">All territories</option>
            <option value="__none__">Unassigned</option>
            {territoryOptions.map(([tId, tName]) => <option key={tId} value={tId}>{tName}</option>)}
          </select>
        </FilterBar.Field>
        <FilterBar.Field label="City" htmlFor="f-city">
          <select id="f-city" className="form-select form-select-sm" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">All cities</option>
            {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </FilterBar.Field>
        <FilterBar.Field label="District" htmlFor="f-district">
          <select id="f-district" className="form-select form-select-sm" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            <option value="">All districts</option>
            {districtOptions.map(district => <option key={district} value={district}>{district}</option>)}
          </select>
        </FilterBar.Field>
        <FilterBar.Field label="State" htmlFor="f-state">
          <select id="f-state" className="form-select form-select-sm" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="">All states</option>
            {stateOptions.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
        </FilterBar.Field>
        {hasLocationFilters && (
          <FilterBar.Actions>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearLocationFilters}>
              <i className="bi bi-x-circle me-1"></i> Clear filters
            </button>
          </FilterBar.Actions>
        )}
      </FilterBar>

      {error && (
        <div className="alert alert-danger border-0 d-flex align-items-center gap-2 mb-0">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>Could not load doctors. {error.message || 'Please try again.'}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filteredDoctors}
        pageSize={25}
        rowKey={(d) => d._id}
        loading={loading}
        mobileCards
        empty={
          <EmptyState
            icon="bi-person-x"
            title="No doctors found"
            description={q || hasLocationFilters || incompleteOnly
              ? 'No doctors match the current search and filters.'
              : 'No doctors have been added yet.'}
            action={!q && !hasLocationFilters && !incompleteOnly && (
              <Link to="/doctors/add" className="btn btn-primary rounded-3">
                <i className="bi bi-plus-lg me-2"></i> Add your first doctor
              </Link>
            )}
          />
        }
      />

      {assignTarget && (
        <AssignVisitModal
          doctorId={assignTarget._id}
          targetName={assignTarget.name}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => alert(`Visit to ${assignTarget.name} assigned successfully.`)}
        />
      )}

      {showImport && (
        <DoctorImportModal
          onClose={() => setShowImport(false)}
          onImported={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </PageContainer>
  )
}

export default Doctors
