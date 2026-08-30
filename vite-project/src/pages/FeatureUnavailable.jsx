import { Link } from 'react-router-dom'
import { getDashboardRoute } from '../utils/dashboardRoute'
import { useSelector } from 'react-redux'

const FeatureUnavailable = ({ feature }) => {
  const role = useSelector((s) => s.auth.user?.role)
  return (
    <div className="container-fluid py-4">
      <div className="mf-page mf-page--narrow">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5 px-4">
            <div
              className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ width: 72, height: 72, background: 'var(--mf-color-warning-subtle)', color: 'var(--mf-color-warning)' }}
            >
              <i className="bi bi-lock fs-2"></i>
            </div>
            <h4 className="fw-bold mb-2">This feature isn&apos;t available</h4>
            <p className="text-muted mb-4">
              {feature ? <>The <strong>{feature.replace(/_/g, ' ')}</strong> feature</> : 'This feature'} is not enabled for your
              company. Contact your administrator if you think this is a mistake.
            </p>
            <Link to={getDashboardRoute(role)} className="btn btn-primary rounded-3">
              <i className="bi bi-arrow-left me-2"></i> Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeatureUnavailable
