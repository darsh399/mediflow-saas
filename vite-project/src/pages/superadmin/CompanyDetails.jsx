import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import superAdminApi from '../../api/superAdminApi'
import { useNotify } from '../../components/NotificationProvider'
import BackButton from '../../components/BackButton'

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

  const isPending = [
    'PENDING',
    'PENDING_APPROVAL',
    'PENDING_ACTIVATION'
  ].includes(company.status)

  return (
    <div className="container-fluid py-4">

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">

        <div className="d-flex align-items-center gap-3">
          <BackButton />

          <div>
            <div className="text-primary fw-semibold small">
              SUPER ADMIN
            </div>

            <h2 className="fw-bold mb-1">
              Company Details
            </h2>

            <p className="text-muted mb-0">
              Manage company account, owner and subscription.
            </p>
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

          <div className="card border-0 shadow-sm h-100">

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

          <div className="card border-0 shadow-sm h-100">

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

          <div className="card border-0 shadow-sm h-100">

            <div className="card-body p-4">

              <div className="text-muted small mb-2">
                SUBSCRIPTIONS
              </div>

              <h2 className="fw-bold mb-0">
                {subscriptions.length}
              </h2>

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

                  <div className="border rounded-3 p-4 h-100">

                    <div className="d-flex justify-content-between align-items-start mb-3">

                      <div>

                        <div className="text-muted small">
                          PLAN
                        </div>

                        <h5 className="fw-bold mb-0 mt-1">
                          {subscription.plan || '-'}
                        </h5>

                      </div>

                      <span className="badge bg-primary-subtle text-primary">
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