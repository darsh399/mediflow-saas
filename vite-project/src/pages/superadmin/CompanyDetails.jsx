import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import superAdminApi from '../../api/superAdminApi'
import { useNotify } from '../../components/NotificationProvider'
import BackButton from '../../components/BackButton'

const PLAN_OPTIONS = [
  { value: 'TRIAL', label: 'Trial (14 days)' },
  { value: 'FREE', label: 'Free' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
  { value: '1_MONTH', label: '1 Month' },
  { value: '3_MONTHS', label: '3 Months' },
  { value: '6_MONTHS', label: '6 Months' },
  { value: '1_YEAR', label: '1 Year' },
  { value: '2_YEAR', label: '2 Years' },
  { value: '3_YEAR', label: '3 Years' },
]

const PLAN_COLORS = {
  TRIAL: '#0dcaf0',
  FREE: '#6c757d',
  BASIC: '#0d6efd',
  PROFESSIONAL: '#6610f2',
  ENTERPRISE: '#d63384',
  '1_MONTH': '#fd7e14',
  '3_MONTHS': '#fd7e14',
  '6_MONTHS': '#20c997',
  '1_YEAR': '#198754',
  '2_YEAR': '#198754',
  '3_YEAR': '#198754',
}

const fmtDate = d =>
  d ? new Date(d).toLocaleString() : '-'

const getStatusBadge = status => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="badge bg-success-subtle text-success px-3 py-2">
          Active
        </span>
      )

    case 'BLOCKED':
      return (
        <span className="badge bg-danger-subtle text-danger px-3 py-2">
          Blocked
        </span>
      )

    case 'REJECTED':
      return (
        <span className="badge bg-danger-subtle text-danger px-3 py-2">
          Rejected
        </span>
      )

    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'PENDING_ACTIVATION':
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis px-3 py-2">
          Pending
        </span>
      )

    default:
      return (
        <span className="badge bg-secondary-subtle text-secondary px-3 py-2">
          {status || 'Unknown'}
        </span>
      )
  }
}

const getInitials = name => {
  if (!name) return 'C'

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const CompanyDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotify()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [subForm, setSubForm] = useState({ plan: 'TRIAL', extendMonths: '', autoRenew: false })
  const [subLoading, setSubLoading] = useState(false)

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true)

        const response = await superAdminApi.getCompany(id)

        setData(response)
      } catch (error) {
        console.error(error)

        notify(
          'Error',
          error?.response?.data?.message ||
            'Unable to load company details'
        )
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
  }, [id])

  const changeStatus = async status => {
    try {
      setActionLoading(true)

      await superAdminApi.updateCompanyStatus(id, {
        status
      })

      const response =
        await superAdminApi.getCompany(id)

      setData(response)

      notify(
        'Status Updated',
        `Company marked as ${status}`
      )
    } catch (error) {
      console.error(error)

      notify(
        'Error',
        error?.response?.data?.message ||
          'Unable to update company status'
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Delete this company? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      setActionLoading(true)

      await superAdminApi.deleteCompany(id)

      notify(
        'Company Deleted',
        'Company has been deleted successfully'
      )

      navigate('/superadmin/companies/list')
    } catch (error) {
      console.error(error)

      notify(
        'Error',
        error?.response?.data?.message ||
          'Delete failed'
      )

      setActionLoading(false)
    }
  }

  const saveSubscription = async event => {
    event.preventDefault()

    try {
      setSubLoading(true)

      await superAdminApi.updateCompanySubscription(id, {
        plan: subForm.plan,
        extendMonths: subForm.extendMonths ? Number(subForm.extendMonths) : undefined,
        autoRenew: subForm.autoRenew,
      })

      const response = await superAdminApi.getCompany(id)
      setData(response)

      notify(
        'Subscription Updated',
        `Plan set to ${subForm.plan.replace(/_/g, ' ')}.`
      )

      setSubForm({ plan: subForm.plan, extendMonths: '', autoRenew: subForm.autoRenew })
    } catch (error) {
      console.error(error)

      notify(
        'Error',
        error?.response?.data?.message ||
          'Unable to update subscription'
      )
    } finally {
      setSubLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
            />

            <h6 className="text-muted mb-0">
              Loading company details...
            </h6>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          Company details could not be found.
        </div>
      </div>
    )
  }

  const company = data.company
  const owner = data.owner
  const subscriptions = data.subscriptions || []
  const currentSubscription = subscriptions[0] || null

  const isPending = [
    'PENDING',
    'PENDING_APPROVAL',
    'PENDING_ACTIVATION'
  ].includes(company.status)

  return (
    <div className="container-fluid py-4">

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div
          className="card-body p-4 p-lg-5 text-white"
          style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)' }}
        >
          <div className="d-flex flex-wrap align-items-center gap-3">
            <BackButton />
            <div className="opacity-75 small">SUPER ADMIN</div>
          </div>

          <div className="d-flex align-items-center gap-3 mt-2">
            <div
              className="rounded-4 bg-white bg-opacity-25 d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '64px', height: '64px', fontSize: '22px' }}
            >
              {getInitials(company.companyName)}
            </div>
            <div>
              <h2 className="fw-bold mb-1">{company.companyName}</h2>
              <p className="mb-0 opacity-75">Manage company account, owner and subscription.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">

          <div className="row align-items-center">

            <div className="col-lg-7">

              <div className="d-flex align-items-center gap-3">

                <div
                  className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '70px',
                    height: '70px',
                    fontSize: '24px'
                  }}
                >
                  {getInitials(company.companyName)}
                </div>

                <div>

                  <h3 className="fw-bold mb-1">
                    {company.companyName}
                  </h3>

                  <div className="text-muted mb-2">
                    {company.companyEmail || 'No company email'}
                  </div>

                  {getStatusBadge(company.status)}

                </div>

              </div>

            </div>

            <div className="col-lg-5 mt-4 mt-lg-0">

              <div className="d-flex flex-wrap justify-content-lg-end gap-2">

                {isPending && (
                  <>
                    <button
                      className="btn btn-success"
                      disabled={actionLoading}
                      onClick={() =>
                        changeStatus('ACTIVE')
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="btn btn-outline-danger"
                      disabled={actionLoading}
                      onClick={() =>
                        changeStatus('REJECTED')
                      }
                    >
                      Reject
                    </button>
                  </>
                )}

                {!isPending &&
                  company.status !== 'REJECTED' && (
                    <>
                      {company.status !== 'BLOCKED' ? (
                        <button
                          className="btn btn-warning"
                          disabled={actionLoading}
                          onClick={() =>
                            changeStatus('BLOCKED')
                          }
                        >
                          Block Company
                        </button>
                      ) : (
                        <button
                          className="btn btn-success"
                          disabled={actionLoading}
                          onClick={() =>
                            changeStatus('ACTIVE')
                          }
                        >
                          Activate Company
                        </button>
                      )}
                    </>
                  )}

                <button
                  className="btn btn-danger"
                  disabled={actionLoading}
                  onClick={handleDelete}
                >
                  Delete
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

      <div className="row g-4 mb-4">

        <div className="col-xl-4 col-md-6">

          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0d6efd' }}>

            <div className="card-body p-4">

              <div className="text-muted small mb-2">
                EMPLOYEES
              </div>

              <div className="d-flex justify-content-between align-items-center">

                <h2 className="fw-bold mb-0">
                  {data.employeeCount ?? 0}
                </h2>

                <div
                  className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                  style={{
                    width: '48px',
                    height: '48px'
                  }}
                >
                  👥
                </div>

              </div>

              <div className="text-muted small mt-2">
                Total employees in this company
              </div>

            </div>

          </div>

        </div>

        <div className="col-xl-4 col-md-6">

          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${company.status === 'ACTIVE' ? '#198754' : company.status === 'BLOCKED' || company.status === 'REJECTED' ? '#dc3545' : '#fd7e14'}` }}>

            <div className="card-body p-4">

              <div className="text-muted small mb-2">
                ACCOUNT STATUS
              </div>

              <div className="mb-2">
                {getStatusBadge(company.status)}
              </div>

              <div className="text-muted small">
                Current company account status
              </div>

            </div>

          </div>

        </div>

        <div className="col-xl-4 col-md-12">

          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${PLAN_COLORS[currentSubscription?.plan] || '#6610f2'}` }}>

            <div className="card-body p-4">

              <div className="text-muted small mb-2">
                SUBSCRIPTIONS
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <h2 className="fw-bold mb-0">
                  {subscriptions.length}
                </h2>
                {currentSubscription && (
                  <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: `${PLAN_COLORS[currentSubscription.plan] || '#6610f2'}22`, color: PLAN_COLORS[currentSubscription.plan] || '#6610f2' }}>
                    {currentSubscription.plan?.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <div className="text-muted small mt-2">
                Subscription records
              </div>

            </div>

          </div>

        </div>

      </div>

      <div className="row g-4">

        <div className="col-xl-6">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-header bg-white border-0 p-4">

              <h5 className="fw-bold mb-1">
                Company Information
              </h5>

              <p className="text-muted small mb-0">
                Registered company information
              </p>

            </div>

            <div className="card-body px-4 pt-0">

              <div className="row g-4">

                <div className="col-md-6">
                  <div className="text-muted small">
                    Company Name
                  </div>

                  <div className="fw-semibold mt-1">
                    {company.companyName || '-'}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="text-muted small">
                    Email
                  </div>

                  <div className="fw-semibold mt-1 text-break">
                    {company.companyEmail || '-'}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="text-muted small">
                    Mobile
                  </div>

                  <div className="fw-semibold mt-1">
                    {company.companyMobile || '-'}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="text-muted small">
                    Website
                  </div>

                  <div className="fw-semibold mt-1 text-break">
                    {company.companyWebsite || '-'}
                  </div>
                </div>

                <div className="col-12">
                  <div className="text-muted small">
                    Address
                  </div>

                  <div className="fw-semibold mt-1">
                    {company.companyAddress || '-'}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        <div className="col-xl-6">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-header bg-white border-0 p-4">

              <h5 className="fw-bold mb-1">
                Company Owner
              </h5>

              <p className="text-muted small mb-0">
                Account owner information
              </p>

            </div>

            <div className="card-body px-4 pt-0">

              {owner ? (

                <>

                  <div className="d-flex align-items-center gap-3 mb-4">

                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: '55px',
                        height: '55px'
                      }}
                    >
                      {getInitials(owner.name)}
                    </div>

                    <div>

                      <h5 className="fw-bold mb-1">
                        {owner.name || '-'}
                      </h5>

                      <span className="badge bg-primary-subtle text-primary">
                        {owner.role || 'Owner'}
                      </span>

                    </div>

                  </div>

                  <div className="row g-4">

                    <div className="col-md-6">

                      <div className="text-muted small">
                        Email
                      </div>

                      <div className="fw-semibold mt-1 text-break">
                        {owner.email || '-'}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <div className="text-muted small">
                        Mobile
                      </div>

                      <div className="fw-semibold mt-1">
                        {owner.mobile || '-'}
                      </div>

                    </div>

                  </div>

                </>

              ) : (

                <div className="text-muted py-4">
                  No owner assigned to this company.
                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      <div className="card border-0 shadow-sm mt-4 overflow-hidden">

        <div className="card-header border-0 p-4 text-white" style={{ background: 'linear-gradient(135deg, #6610f2 0%, #d63384 100%)' }}>
          <h5 className="fw-bold mb-1">
            <i className="bi bi-credit-card me-2"></i>
            Manage Subscription
          </h5>
          <p className="mb-0 opacity-75 small">
            {currentSubscription ? 'Change the plan or extend the current subscription.' : 'This company has no subscription yet — set one up below.'}
          </p>
        </div>

        <div className="card-body p-4">
          <form className="row g-3 align-items-end" onSubmit={saveSubscription}>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Plan</label>
              <select
                className="form-select"
                value={subForm.plan}
                onChange={event => setSubForm({ ...subForm, plan: event.target.value })}
              >
                {PLAN_OPTIONS.map(option => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Extend by (months)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="Optional"
                value={subForm.extendMonths}
                onChange={event => setSubForm({ ...subForm, extendMonths: event.target.value })}
              />
              <div className="form-text">Leave blank to use the plan's default duration{currentSubscription ? ' (or keep the current end date if no extension is given)' : ''}.</div>
            </div>

            <div className="col-md-3">
              <div className="form-check mt-4">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="autoRenewCheck"
                  checked={subForm.autoRenew}
                  onChange={event => setSubForm({ ...subForm, autoRenew: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="autoRenewCheck">Auto-renew</label>
              </div>
            </div>

            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100 rounded-3" disabled={subLoading}>
                {subLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i>
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm mt-4">

        <div className="card-header bg-white border-0 p-4">

          <h5 className="fw-bold mb-1">
            Subscription History
          </h5>

          <p className="text-muted small mb-0">
            Company subscription and plan information
          </p>

        </div>

        <div className="card-body px-4 pt-0">

          {subscriptions.length === 0 ? (

            <div className="text-center text-muted py-4">
              No subscription records found.
            </div>

          ) : (

            <div className="row g-3">

              {subscriptions.map(subscription => (

                <div
                  key={subscription._id}
                  className="col-xl-4 col-md-6"
                >

                  <div className="border rounded-3 p-4 h-100" style={{ borderLeft: `4px solid ${PLAN_COLORS[subscription.plan] || '#6610f2'}` }}>

                    <div className="d-flex justify-content-between align-items-start mb-3">

                      <div>

                        <div className="text-muted small">
                          PLAN
                        </div>

                        <h5 className="fw-bold mb-0 mt-1" style={{ color: PLAN_COLORS[subscription.plan] || '#6610f2' }}>
                          {(subscription.plan || '-').replace(/_/g, ' ')}
                        </h5>

                      </div>

                      <span className="badge" style={{ backgroundColor: `${PLAN_COLORS[subscription.plan] || '#6610f2'}22`, color: PLAN_COLORS[subscription.plan] || '#6610f2' }}>
                        {subscription.status || '-'}
                      </span>

                    </div>

                    <div className="small mb-2">
                      <span className="text-muted">
                        Start Date
                      </span>

                      <div className="fw-semibold">
                        {fmtDate(
                          subscription.startDate
                        )}
                      </div>
                    </div>

                    <div className="small mb-2">
                      <span className="text-muted">
                        End Date
                      </span>

                      <div className="fw-semibold">
                        {fmtDate(
                          subscription.endDate
                        )}
                      </div>
                    </div>

                    <div className="small">
                      <span className="text-muted">
                        Created
                      </span>

                      <div className="fw-semibold">
                        {fmtDate(
                          subscription.createdAt
                        )}
                      </div>
                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  )
}

export default CompanyDetails