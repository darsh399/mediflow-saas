import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  const sections = [
    {
      number: "01",
      title: "Information We Collect",
      icon: "bi-database-lock",
      color: "primary",
      description:
        "MediFlow may collect information required to provide and operate our business management and SaaS services.",
      points: [
        "Company and organization information",
        "Employee name and contact information",
        "Professional and employment information",
        "Profile and onboarding information",
        "Documents uploaded by authorized users",
        "Doctor and business-related information",
        "Visit and operational activity information",
        "Account and authentication information",
        "Information submitted through enquiry forms",
      ],
    },
    {
      number: "02",
      title: "How We Use Information",
      icon: "bi-gear-wide-connected",
      color: "success",
      description:
        "Information collected through MediFlow may be used to operate, secure and improve the platform.",
      points: [
        "Provide and maintain the MediFlow platform",
        "Manage company and employee accounts",
        "Support employee onboarding and profile management",
        "Manage doctors, visits, tasks and business operations",
        "Process enquiries and provide customer support",
        "Improve application performance and functionality",
        "Maintain platform security",
        "Prevent unauthorized access or misuse",
      ],
    },
    {
      number: "03",
      title: "Employee and Company Data",
      icon: "bi-building",
      color: "info",
      description:
        "MediFlow allows organizations to manage their own business and employee information.",
      points: [
        "Organizations control the information entered into their accounts",
        "Company administrators are responsible for appropriate data collection",
        "Employee information is managed according to organizational permissions",
        "Organizations should follow applicable privacy and data protection requirements",
      ],
    },
    {
      number: "04",
      title: "Document Information",
      icon: "bi-file-earmark-lock2",
      color: "warning",
      description:
        "Users may upload documents as part of employee onboarding and profile management.",
      points: [
        "Identity documents",
        "Education documents",
        "Address proof",
        "Employment documents",
        "Other business-related documents",
      ],
    },
    {
      number: "05",
      title: "Data Security",
      icon: "bi-shield-check",
      color: "danger",
      description:
        "We take reasonable technical and organizational measures to protect information stored and processed through MediFlow.",
      points: [
        "Authenticated access",
        "Role-based permissions",
        "Secure API communication",
        "Controlled access to business information",
        "Security controls appropriate to the platform",
      ],
    },
    {
      number: "06",
      title: "Access Control",
      icon: "bi-person-lock",
      color: "primary",
      description:
        "MediFlow uses role-based access controls to help users access only permitted features and information.",
      points: [
        "Super Admin",
        "Company Owner",
        "HR Manager",
        "HR",
        "Manager",
        "Project Manager",
        "Employee",
        "MR",
      ],
    },
    {
      number: "07",
      title: "Company Data Isolation",
      icon: "bi-buildings",
      color: "success",
      description:
        "MediFlow is designed as a multi-company SaaS platform where company information remains associated with the relevant organization.",
      points: [
        "Company-specific data access",
        "Role-based company permissions",
        "Organization-level data separation",
        "Controlled access to employee information",
      ],
    },
    {
      number: "08",
      title: "Third-Party Services",
      icon: "bi-cloud-check",
      color: "info",
      description:
        "MediFlow may use trusted third-party services to support infrastructure and platform operations.",
      points: [
        "Infrastructure and hosting",
        "Email delivery",
        "File storage",
        "Authentication services",
        "Analytics",
        "Other operational services",
      ],
    },
    {
      number: "09",
      title: "Cookies and Similar Technologies",
      icon: "bi-cookie",
      color: "warning",
      description:
        "MediFlow may use cookies, browser storage or similar technologies where necessary.",
      points: [
        "Authentication",
        "Security",
        "User preferences",
        "Application functionality",
      ],
    },
    {
      number: "10",
      title: "Data Retention",
      icon: "bi-clock-history",
      color: "secondary",
      description:
        "Information may be retained for as long as necessary to provide services and meet applicable requirements.",
      points: [
        "Service delivery",
        "Business records",
        "Legal requirements",
        "Dispute resolution",
        "Agreement enforcement",
      ],
    },
    {
      number: "11",
      title: "Your Responsibilities",
      icon: "bi-person-check",
      color: "success",
      description:
        "Users and organizations are responsible for maintaining appropriate account and information security.",
      points: [
        "Keep account credentials confidential",
        "Provide accurate information",
        "Submit information lawfully",
        "Ensure appropriate authorization",
      ],
    },
    {
      number: "12",
      title: "Data Requests",
      icon: "bi-envelope-paper",
      color: "primary",
      description:
        "Questions or requests regarding information stored or processed through MediFlow can be directed to our support team.",
      points: [
        "Privacy-related questions",
        "Information access requests",
        "Data-related concerns",
        "Account verification may be required",
      ],
    },
    {
      number: "13",
      title: "Children's Privacy",
      icon: "bi-people",
      color: "info",
      description:
        "MediFlow is intended for business and organizational use and is not directed toward children.",
      points: [
        "Business-focused platform",
        "Not intended for independent child use",
        "We do not knowingly request children's personal information",
      ],
    },
    {
      number: "14",
      title: "Changes to This Privacy Policy",
      icon: "bi-arrow-repeat",
      color: "warning",
      description:
        "We may update this Privacy Policy from time to time to reflect changes to our services, technology or requirements.",
      points: [
        "Service changes",
        "Technology updates",
        "Security improvements",
        "Changes in applicable requirements",
      ],
    },
  ];

  return (
    <div className="privacy-page min-vh-100">
      <section
        className="privacy-hero text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 55%, #8e44ad 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-9 py-4">
              <div className="privacy-hero-icon mx-auto mb-4">
                <i className="bi bi-shield-lock"></i>
              </div>

              <span className="badge bg-white text-primary rounded-pill px-4 py-2 mb-3">
                Privacy & Security
              </span>

              <h1 className="display-4 fw-bold mb-3">
                Privacy Policy
              </h1>

              <p className="lead opacity-75 mb-3">
                We believe your information deserves transparency,
                protection and responsible handling.
              </p>

              <div className="small opacity-75">
                Last updated: August 23, 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div
                className="card border-0 shadow-sm rounded-4 sticky-lg-top"
                style={{ top: "20px" }}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="summary-icon bg-primary bg-opacity-10 text-primary">
                      <i className="bi bi-shield-check"></i>
                    </div>

                    <div>
                      <h5 className="fw-bold mb-1">
                        Privacy at a Glance
                      </h5>

                      <small className="text-muted">
                        How MediFlow handles information
                      </small>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon bg-success bg-opacity-10 text-success">
                      <i className="bi bi-lock"></i>
                    </div>

                    <div>
                      <h6 className="fw-bold mb-1">
                        Secure Access
                      </h6>

                      <small className="text-muted">
                        Authentication and role-based permissions
                        help control access.
                      </small>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon bg-info bg-opacity-10 text-info">
                      <i className="bi bi-buildings"></i>
                    </div>

                    <div>
                      <h6 className="fw-bold mb-1">
                        Company Isolation
                      </h6>

                      <small className="text-muted">
                        Company information is designed to remain
                        associated with the relevant organization.
                      </small>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon bg-warning bg-opacity-10 text-warning">
                      <i className="bi bi-file-earmark-lock"></i>
                    </div>

                    <div>
                      <h6 className="fw-bold mb-1">
                        Document Protection
                      </h6>

                      <small className="text-muted">
                        Uploaded documents are protected through
                        application permissions.
                      </small>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon bg-danger bg-opacity-10 text-danger">
                      <i className="bi bi-headset"></i>
                    </div>

                    <div>
                      <h6 className="fw-bold mb-1">
                        Support
                      </h6>

                      <small className="text-muted">
                        Our support team can help with privacy
                        questions.
                      </small>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <Link
                    to="/contact"
                    className="btn btn-primary w-100 rounded-3 py-2"
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4 p-md-5">
                  <div className="policy-intro p-4 rounded-4 mb-5">
                    <div className="d-flex gap-3">
                      <div className="text-primary fs-3">
                        <i className="bi bi-info-circle"></i>
                      </div>

                      <div>
                        <h5 className="fw-bold mb-2">
                          About this policy
                        </h5>

                        <p className="text-muted mb-0 lh-lg">
                          This Privacy Policy describes how MediFlow
                          may collect, use, protect and manage
                          information when you use our platform and
                          related services.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    {sections.map((section) => (
                      <div
                        className="col-md-6"
                        key={section.number}
                      >
                        <div className="policy-card h-100">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div
                              className={`section-icon bg-${section.color} bg-opacity-10 text-${section.color}`}
                            >
                              <i
                                className={`bi ${section.icon}`}
                              ></i>
                            </div>

                            <span className="section-number">
                              {section.number}
                            </span>
                          </div>

                          <h5 className="fw-bold mb-2">
                            {section.title}
                          </h5>

                          <p className="text-muted small lh-lg mb-3">
                            {section.description}
                          </p>

                          <div className="policy-points">
                            {section.points.map(
                              (point, pointIndex) => (
                                <div
                                  key={pointIndex}
                                  className="policy-point"
                                >
                                  <span
                                    className={`point-icon text-${section.color}`}
                                  >
                                    <i className="bi bi-check-circle-fill"></i>
                                  </span>

                                  <span>{point}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="contact-policy mt-5">
                    <div className="row align-items-center g-4">
                      <div className="col-md-8">
                        <div className="d-flex gap-3">
                          <div className="contact-icon">
                            <i className="bi bi-shield-check"></i>
                          </div>

                          <div>
                            <h4 className="fw-bold mb-2">
                              Your trust matters
                            </h4>

                            <p className="text-muted mb-0 lh-lg">
                              MediFlow is designed with security,
                              controlled access and responsible data
                              handling in mind. If you have questions
                              about how your information is handled,
                              our support team is available to assist
                              you.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4 text-md-end">
                        <Link
                          to="/contact"
                          className="btn btn-primary rounded-3 px-4"
                        >
                          Get in Touch
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="contact-details mt-4 p-4 rounded-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center gap-3">
                          <div className="mini-icon text-primary">
                            <i className="bi bi-envelope"></i>
                          </div>

                          <div>
                            <small className="text-muted d-block">
                              Email
                            </small>

                            <a
                              href="mailto:support@mediflow.com"
                              className="text-decoration-none fw-semibold"
                            >
                              support@mediflow.com
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="d-flex align-items-center gap-3">
                          <div className="mini-icon text-success">
                            <i className="bi bi-telephone"></i>
                          </div>

                          <div>
                            <small className="text-muted d-block">
                              Phone
                            </small>

                            <a
                              href="tel:+919876543210"
                              className="text-decoration-none fw-semibold"
                            >
                              +91 98765 43210
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <Link
                  to="/"
                  className="text-decoration-none text-muted"
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to MediFlow
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>
        {`
          .privacy-page {
            color: #212529;
          }

          .privacy-hero {
            position: relative;
            overflow: hidden;
          }

          .privacy-hero::before {
            content: "";
            position: absolute;
            width: 450px;
            height: 450px;
            border-radius: 50%;
            background: rgba(255,255,255,0.06);
            top: -250px;
            right: -100px;
          }

          .privacy-hero::after {
            content: "";
            position: absolute;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: rgba(255,255,255,0.05);
            bottom: -180px;
            left: -80px;
          }

          .privacy-hero > .container {
            position: relative;
            z-index: 2;
          }

          .privacy-hero-icon {
            width: 82px;
            height: 82px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.14);
            border: 1px solid rgba(255,255,255,0.2);
            font-size: 38px;
            backdrop-filter: blur(10px);
          }

          .summary-item {
            display: flex;
            gap: 14px;
            margin-bottom: 25px;
          }

          .summary-icon {
            min-width: 44px;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }

          .policy-intro {
            background: linear-gradient(
              135deg,
              rgba(13, 148, 136, 0.06),
              rgba(99,102,241,0.06)
            );
            border: 1px solid rgba(13, 148, 136, 0.15);
          }

          .policy-card {
            border: 1px solid #e9ecef;
            border-radius: 18px;
            padding: 24px;
            background: #fff;
            transition: all 0.3s ease;
          }

          .policy-card:hover {
            transform: translateY(-5px);
            border-color: rgba(13, 148, 136, 0.25);
            box-shadow: 0 15px 35px rgba(0,0,0,0.08);
          }

          .section-icon {
            width: 50px;
            height: 50px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 23px;
          }

          .section-number {
            font-size: 13px;
            font-weight: 700;
            color: #adb5bd;
            letter-spacing: 1px;
          }

          .policy-points {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .policy-point {
            display: flex;
            align-items: flex-start;
            gap: 9px;
            font-size: 14px;
            color: #495057;
            line-height: 1.5;
          }

          .point-icon {
            font-size: 13px;
            margin-top: 3px;
            flex-shrink: 0;
          }

          .contact-policy {
            padding: 28px;
            border-radius: 20px;
            background: linear-gradient(
              135deg,
              rgba(13, 148, 136, 0.06),
              rgba(99,102,241,0.08)
            );
            border: 1px solid rgba(13, 148, 136, 0.15);
          }

          .contact-icon {
            min-width: 55px;
            width: 55px;
            height: 55px;
            border-radius: 15px;
            background: var(--mf-color-primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 25px;
          }

          .contact-details {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
          }

          .mini-icon {
            width: 42px;
            height: 42px;
            border-radius: 11px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 19px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
          }

          @media (max-width: 991px) {
            .sticky-lg-top {
              position: static !important;
            }
          }

          @media (max-width: 768px) {
            .display-4 {
              font-size: 2.4rem;
            }

            .privacy-hero-icon {
              width: 70px;
              height: 70px;
              font-size: 30px;
            }

            .policy-card {
              padding: 20px;
            }

            .contact-policy {
              padding: 20px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PrivacyPolicy;