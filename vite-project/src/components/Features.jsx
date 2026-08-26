import React from "react";

const features = [
  {
    icon: "bi-building",
    title: "Company Management",
    description:
      "Manage multiple companies from a centralized SaaS platform with secure company-wise data isolation.",
    color: "primary",
  },
  {
    icon: "bi-people",
    title: "Employee Management",
    description:
      "Add, manage and monitor employees with profiles, roles, onboarding and employment information.",
    color: "success",
  },
  {
    icon: "bi-person-badge",
    title: "Doctor Management",
    description:
      "Maintain doctor records, contact information and location details for efficient field operations.",
    color: "info",
  },
  {
    icon: "bi-geo-alt",
    title: "Location-Based Visits",
    description:
      "Track field visits using location verification to ensure visits are recorded from the correct location.",
    color: "danger",
  },
  {
    icon: "bi-calendar-check",
    title: "Leave Management",
    description:
      "Simplify employee leave requests, approvals and leave tracking with a centralized workflow.",
    color: "warning",
  },
  {
    icon: "bi-file-earmark-text",
    title: "Document Management",
    description:
      "Securely manage employee documents including identity, education and previous employment documents.",
    color: "secondary",
  },
  {
    icon: "bi-person-check",
    title: "Employee Onboarding",
    description:
      "Collect employee information and documents through a structured onboarding and profile review process.",
    color: "primary",
  },
  {
    icon: "bi-shield-lock",
    title: "Role-Based Access",
    description:
      "Control access based on roles such as Super Admin, Company Owner, HR, Manager, Employee and MR.",
    color: "dark",
  },
  {
    icon: "bi-bar-chart-line",
    title: "Dashboard & Reports",
    description:
      "Get useful insights with dashboards, statistics and operational reports for better decision-making.",
    color: "success",
  },
  {
    icon: "bi-bell",
    title: "Notifications",
    description:
      "Keep employees and management informed with important system notifications and updates.",
    color: "warning",
  },
  {
    icon: "bi-list-task",
    title: "Task Management",
    description:
      "Create and manage tasks to keep teams organized and improve productivity.",
    color: "info",
  },
  {
    icon: "bi-kanban",
    title: "Project Management",
    description:
      "Organize projects, teams and activities in one centralized workspace.",
    color: "danger",
  },
  {
    icon: "bi-cart3",
    title: "Order Management",
    description:
      "Manage orders and business operations efficiently through a centralized system.",
    color: "primary",
  },
  {
    icon: "bi-person-circle",
    title: "Employee Profiles",
    description:
      "Employees can maintain their personal information, documents and professional details.",
    color: "success",
  },
  {
    icon: "bi-key",
    title: "Secure Authentication",
    description:
      "Protect your application with secure login, password reset and authenticated access.",
    color: "secondary",
  },
  {
    icon: "bi-speedometer2",
    title: "SaaS Ready",
    description:
      "Built with a scalable architecture designed to support multiple companies from one platform.",
    color: "dark",
  },
];

const Features = () => {
  return (
    <div className="features-page bg-light min-vh-100">
      <section
        className="py-5"
        style={{
          background:
            "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-9">
              <span className="badge bg-white text-primary rounded-pill px-3 py-2 mb-3">
                Powerful SaaS Platform
              </span>

              <h1 className="display-4 fw-bold text-white mb-3">
                Everything You Need to
                <br />
                Manage Your Business
              </h1>

              <p className="lead text-white opacity-75 mb-0">
                MediFlow brings employees, doctors, visits, documents,
                tasks and business operations together in one powerful
                platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {features.map((feature, index) => (
              <div className="col-xl-3 col-lg-4 col-md-6" key={index}>
                <div
                  className="card h-100 border-0 shadow-sm feature-card"
                  style={{
                    borderRadius: "18px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div className="card-body p-4">
                    <div
                      className={`bg-${feature.color} bg-opacity-10 text-${feature.color} rounded-4 d-flex align-items-center justify-content-center mb-4`}
                      style={{
                        width: "58px",
                        height: "58px",
                      }}
                    >
                      <i
                        className={`bi ${feature.icon}`}
                        style={{ fontSize: "26px" }}
                      ></i>
                    </div>

                    <h5 className="fw-bold mb-3">
                      {feature.title}
                    </h5>

                    <p className="text-muted mb-0 lh-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <div
            className="rounded-4 p-5 text-center text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--mf-slate-900) 0%, var(--mf-slate-800) 100%)",
            }}
          >
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <i
                  className="bi bi-rocket-takeoff"
                  style={{ fontSize: "45px" }}
                ></i>

                <h2 className="fw-bold mt-3 mb-3">
                  Built for Modern Businesses
                </h2>

                <p className="text-white-50 mb-4">
                  Manage your entire organization from one secure,
                  scalable and easy-to-use SaaS platform.
                </p>

                <div className="d-flex justify-content-center flex-wrap gap-3">
                  <span className="badge bg-primary px-3 py-2">
                    Secure
                  </span>

                  <span className="badge bg-success px-3 py-2">
                    Scalable
                  </span>

                  <span className="badge bg-info px-3 py-2">
                    Responsive
                  </span>

                  <span className="badge bg-warning text-dark px-3 py-2">
                    Easy to Use
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>
        {`
          .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12) !important;
          }

          .feature-card:hover .bi {
            transform: scale(1.15);
          }

          .feature-card .bi {
            transition: transform 0.3s ease;
          }

          @media (max-width: 768px) {
            .display-4 {
              font-size: 2.3rem;
            }

            .features-page .py-5 {
              padding-top: 3rem !important;
              padding-bottom: 3rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Features;