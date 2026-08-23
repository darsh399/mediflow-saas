const About = () => {
  const features = [
    {
      icon: '👥',
      title: 'Employee Management',
      description:
        'Manage employee profiles, roles, account status, joining information, and organizational data from one centralized platform.'
    },
    {
      icon: '🩺',
      title: 'Doctor & Medical Directory',
      description:
        'Maintain a structured directory of doctors and medical facilities with relevant contact and location information.'
    },
    {
      icon: '📍',
      title: 'Field Visit Tracking',
      description:
        'Record field visits with location verification to help teams maintain accurate and reliable visit records.'
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description:
        'Get better visibility into field activities, employee operations, visits, and organizational performance.'
    },
    {
      icon: '🔐',
      title: 'Role-Based Access',
      description:
        'Control access based on organizational roles and ensure users only access the information relevant to their responsibilities.'
    },
    {
      icon: '📝',
      title: 'Audit & Activity Tracking',
      description:
        'Maintain visibility into important activities and operational changes for better accountability and transparency.'
    }
  ]

  const audiences = [
    'Medical and pharmaceutical organizations',
    'Field sales and medical representative teams',
    'HR and administrative teams',
    'Companies managing distributed employees',
    'Organizations requiring field visit tracking'
  ]

  return (
    <div className="bg-light">

      <section className="bg-white border-bottom">
        <div className="container py-5">
          <div className="row align-items-center py-lg-5">
            <div className="col-lg-7">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 mb-3">
                MEDIFLOW • BUSINESS MANAGEMENT PLATFORM
              </span>

              <h1 className="display-4 fw-bold mb-3">
                One platform to manage your
                <span className="text-primary">
                  {' '}people, field operations, and growth.
                </span>
              </h1>

              <p className="lead text-muted mb-4">
                MediFlow is a modern SaaS platform designed to simplify
                employee management, HR operations, doctor and medical
                directories, field visits, location verification, and
                business reporting.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-primary btn-lg px-4">
                  Get Started
                </button>

                <button className="btn btn-outline-secondary btn-lg px-4">
                  Explore Features
                </button>
              </div>
            </div>

            <div className="col-lg-5 mt-5 mt-lg-0">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <small className="text-muted">
                        MediFlow Dashboard
                      </small>

                      <h5 className="fw-bold mb-0">
                        Business Overview
                      </h5>
                    </div>

                    <span className="badge bg-success">
                      Live
                    </span>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <div className="bg-light rounded p-3">
                        <small className="text-muted">
                          Employees
                        </small>

                        <h5 className="fw-bold mb-0">
                          Management
                        </h5>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="bg-light rounded p-3">
                        <small className="text-muted">
                          Field Visits
                        </small>

                        <h5 className="fw-bold mb-0">
                          Tracking
                        </h5>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="bg-light rounded p-3">
                        <small className="text-muted">
                          Access
                        </small>

                        <h5 className="fw-bold mb-0">
                          Secure
                        </h5>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="bg-light rounded p-3">
                        <small className="text-muted">
                          Reports
                        </small>

                        <h5 className="fw-bold mb-0">
                          Insights
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <span className="text-primary fw-semibold">
                ABOUT MEDIFLOW
              </span>

              <h2 className="fw-bold mt-2 mb-3">
                Built to simplify everyday business operations
              </h2>

              <p className="text-muted lead">
                Managing employees, field teams, medical professionals,
                visits, and operational data across different systems can
                become complicated. MediFlow brings these workflows into
                one centralized SaaS platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="text-primary fw-semibold">
              PLATFORM CAPABILITIES
            </span>

            <h2 className="fw-bold mt-2">
              Everything your team needs in one place
            </h2>

            <p className="text-muted">
              Designed to help organizations manage people and field
              operations efficiently.
            </p>
          </div>

          <div className="row g-4">
            {features.map((feature) => (
              <div className="col-md-6 col-lg-4" key={feature.title}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div
                      className="bg-primary-subtle rounded d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: '52px',
                        height: '52px',
                        fontSize: '24px'
                      }}
                    >
                      {feature.icon}
                    </div>

                    <h5 className="fw-bold">
                      {feature.title}
                    </h5>

                    <p className="text-muted mb-0">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="text-primary fw-semibold">
                FIELD OPERATIONS
              </span>

              <h2 className="fw-bold mt-2 mb-3">
                Make field activity more transparent and reliable
              </h2>

              <p className="text-muted">
                MediFlow helps organizations record and manage field
                visits while verifying the location of the employee
                against registered locations.
              </p>

              <div className="mt-4">
                <div className="d-flex gap-3 mb-3">
                  <div className="text-primary fw-bold">✓</div>

                  <div>
                    <strong>Location verification</strong>

                    <p className="text-muted mb-0">
                      Verify field activity using registered location
                      coordinates.
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3 mb-3">
                  <div className="text-primary fw-bold">✓</div>

                  <div>
                    <strong>Visit history</strong>

                    <p className="text-muted mb-0">
                      Maintain a reliable history of employee visits.
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <div className="text-primary fw-bold">✓</div>

                  <div>
                    <strong>Company-level visibility</strong>

                    <p className="text-muted mb-0">
                      Keep business data organized by company and
                      employee access.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between mb-4">
                    <div>
                      <small className="text-muted">
                        FIELD VISIT
                      </small>

                      <h5 className="fw-bold mb-0">
                        Visit Verification
                      </h5>
                    </div>

                    <span className="badge bg-success">
                      Verified
                    </span>
                  </div>

                  <div className="bg-light rounded p-4 text-center">
                    <div
                      className="rounded-circle bg-primary-subtle mx-auto mb-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: '70px',
                        height: '70px',
                        fontSize: '30px'
                      }}
                    >
                      📍
                    </div>

                    <h5 className="fw-bold">
                      Location Verified
                    </h5>

                    <p className="text-muted mb-0">
                      Employee location matched with the registered
                      location.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 order-lg-2">
              <span className="text-primary fw-semibold">
                SECURITY & CONTROL
              </span>

              <h2 className="fw-bold mt-2 mb-3">
                Keep your organization's data under control
              </h2>

              <p className="text-muted">
                MediFlow is designed around secure access and
                organization-level data separation.
              </p>
            </div>

            <div className="col-lg-6 order-lg-1">
              <div className="row g-3">
                <div className="col-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h5>🔐</h5>

                      <h6 className="fw-bold">
                        Role-Based Access
                      </h6>

                      <p className="small text-muted mb-0">
                        Access based on user roles and responsibilities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h5>🏢</h5>

                      <h6 className="fw-bold">
                        Company Isolation
                      </h6>

                      <p className="small text-muted mb-0">
                        Keep each organization's data separated.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h5>📋</h5>

                      <h6 className="fw-bold">
                        Auditability
                      </h6>

                      <p className="small text-muted mb-0">
                        Track important operational activities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h5>⚙️</h5>

                      <h6 className="fw-bold">
                        Centralized Control
                      </h6>

                      <p className="small text-muted mb-0">
                        Manage users and operations from one platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <span className="text-primary fw-semibold">
                WHO IS MEDIFLOW FOR?
              </span>

              <h2 className="fw-bold mt-2 mb-4">
                Built for teams that operate beyond the office
              </h2>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  {audiences.map((audience) => (
                    <div
                      key={audience}
                      className="d-flex gap-3 align-items-center border-bottom py-3"
                    >
                      <span className="text-primary fw-bold">
                        ✓
                      </span>

                      <span>{audience}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-white py-5">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <span className="fw-semibold opacity-75">
                OUR MISSION
              </span>

              <h2 className="fw-bold mt-2 mb-3">
                Simplify operations. Empower teams. Improve visibility.
              </h2>

              <p className="lead opacity-75 mb-0">
                Our mission is to provide organizations with simple,
                reliable, and scalable tools that help them manage
                employees, field operations, and business processes
                more effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-5">
        <div className="container">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-lg-5 text-center">
              <h2 className="fw-bold mb-3">
                Ready to simplify your business operations?
              </h2>

              <p className="text-muted mb-4">
                Bring your employees, field operations, and reporting
                together with MediFlow.
              </p>

              <button className="btn btn-primary btn-lg px-5">
                Get Started with MediFlow
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default About