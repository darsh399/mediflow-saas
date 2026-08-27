import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: "bi-check-circle",
      color: "primary",
      description:
        "By accessing or using MediFlow, you agree to these Terms and Conditions. If you do not agree with any part of these terms, you should not use the platform.",
    },
    {
      title: "About MediFlow",
      icon: "bi-building",
      color: "info",
      description:
        "MediFlow is a business management and SaaS platform designed to help organizations manage employees, onboarding, profiles, documents, doctors, visits, and other business operations.",
    },
    {
      title: "Account Registration",
      icon: "bi-person-plus",
      color: "success",
      description:
        "Users may be required to create an account to access certain features. You are responsible for providing accurate information and maintaining the confidentiality of your login credentials.",
    },
    {
      title: "Company Accounts",
      icon: "bi-buildings",
      color: "primary",
      description:
        "Organizations using MediFlow are responsible for managing their company account, authorized users, employee information, and permissions within the platform.",
    },
    {
      title: "User Responsibilities",
      icon: "bi-person-check",
      color: "success",
      description:
        "Users must use MediFlow responsibly and lawfully. Users should not attempt to gain unauthorized access, misuse another user's account, upload harmful content, or interfere with the operation of the platform.",
    },
    {
      title: "Employee Information",
      icon: "bi-people",
      color: "warning",
      description:
        "Organizations may use MediFlow to manage employee profiles, onboarding information, employment details, and other business-related information. Organizations are responsible for ensuring that they have appropriate authorization to process such information.",
    },
    {
      title: "Documents and Uploaded Content",
      icon: "bi-file-earmark-lock",
      color: "danger",
      description:
        "Users may upload identification, education, employment, address, and other business-related documents. Users and organizations are responsible for ensuring that uploaded content is accurate, lawful, and authorized for use.",
    },
    {
      title: "Role-Based Access",
      icon: "bi-shield-lock",
      color: "info",
      description:
        "MediFlow may provide different access levels based on user roles such as Super Admin, Company Owner, HR, Manager, Employee, MR, or other authorized roles. Users may only access information and functionality permitted by their assigned permissions.",
    },
    {
      title: "Company Data Isolation",
      icon: "bi-database-lock",
      color: "primary",
      description:
        "MediFlow is designed as a multi-company SaaS platform. Company information is intended to remain associated with the relevant organization and access is controlled according to company and role permissions.",
    },
    {
      title: "Acceptable Use",
      icon: "bi-shield-check",
      color: "success",
      description:
        "You agree not to use MediFlow for unlawful activities, unauthorized data access, security attacks, distribution of malicious software, fraudulent activity, or any activity that may harm the platform or other users.",
    },
    {
      title: "Platform Availability",
      icon: "bi-cloud-check",
      color: "info",
      description:
        "We aim to keep MediFlow available and reliable. However, the platform may occasionally be unavailable because of maintenance, upgrades, technical issues, third-party services, or circumstances outside our reasonable control.",
    },
    {
      title: "Third-Party Services",
      icon: "bi-box-arrow-up-right",
      color: "warning",
      description:
        "MediFlow may integrate with third-party services such as hosting providers, email services, storage providers, authentication services, analytics tools, or other infrastructure providers. Their services may be subject to their own terms and policies.",
    },
    {
      title: "Intellectual Property",
      icon: "bi-lightbulb",
      color: "primary",
      description:
        "MediFlow, including its software, design, branding, interface, features, and related materials, may be protected by applicable intellectual property laws. You may not copy, modify, distribute, or reproduce MediFlow without appropriate authorization.",
    },
    {
      title: "Account Suspension",
      icon: "bi-person-x",
      color: "danger",
      description:
        "Access to an account may be suspended or restricted if we reasonably believe that the account is being used in violation of these Terms, applicable laws, security requirements, or platform policies.",
    },
    {
      title: "Data Security",
      icon: "bi-shield-shaded",
      color: "success",
      description:
        "We take reasonable technical and organizational measures to protect information processed through MediFlow. However, no internet-based system can be guaranteed to be completely secure.",
    },
    {
      title: "Service Changes",
      icon: "bi-arrow-repeat",
      color: "info",
      description:
        "MediFlow may add, modify, improve, or remove features from the platform from time to time in order to improve functionality, security, performance, or business operations.",
    },
    {
      title: "Subscriptions and Payments",
      icon: "bi-credit-card",
      color: "success",
      description:
        "Where MediFlow services are offered under a paid subscription, applicable pricing, subscription duration, payment terms, renewal conditions, and other commercial terms may be communicated separately to the customer organization.",
    },
    {
      title: "Termination",
      icon: "bi-door-open",
      color: "warning",
      description:
        "A customer or authorized organization may discontinue use of MediFlow according to the applicable subscription or service agreement. Certain information may continue to be retained where required for legal, security, accounting, or legitimate business purposes.",
    },
    {
      title: "Limitation of Liability",
      icon: "bi-exclamation-triangle",
      color: "danger",
      description:
        "To the extent permitted by applicable law, MediFlow and its operators shall not be responsible for indirect, incidental, special, or consequential losses arising from the use or inability to use the platform.",
    },
    {
      title: "Privacy",
      icon: "bi-lock",
      color: "primary",
      description:
        "Your use of MediFlow is also subject to our Privacy Policy, which explains how information may be collected, used, protected, and managed through the platform.",
    },
    {
      title: "Changes to These Terms",
      icon: "bi-file-earmark-text",
      color: "info",
      description:
        "These Terms and Conditions may be updated from time to time. Updated terms may be published through the MediFlow website or application. Continued use of the platform after changes may constitute acceptance of the updated terms.",
    },
    {
      title: "Governing Law",
      icon: "bi-bank",
      color: "secondary",
      description:
        "These Terms and Conditions shall be interpreted and applied in accordance with applicable laws. Any applicable jurisdiction or dispute-resolution arrangements may also be defined in a separate agreement with the customer organization.",
    },
    {
      title: "Contact Us",
      icon: "bi-headset",
      color: "success",
      description:
        "If you have questions about these Terms and Conditions, please contact the MediFlow support team using the contact information provided below.",
    },
  ];

  return (
    <div className="terms-page bg-light min-vh-100">
      <section
        className="py-5 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 55%, #6f42c1 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-9">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                style={{
                  width: "78px",
                  height: "78px",
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <i
                  className="bi bi-file-earmark-check"
                  style={{ fontSize: "36px" }}
                ></i>
              </div>

              <span className="badge bg-white text-primary rounded-pill px-3 py-2 mb-3">
                Terms & Legal
              </span>

              <h1 className="display-4 fw-bold mb-3">
                Terms & Conditions
              </h1>

              <p className="lead text-white opacity-75 mb-3">
                Please review the terms that govern your use of MediFlow.
              </p>

              <div className="d-flex justify-content-center align-items-center gap-2">
                <i className="bi bi-calendar3"></i>
                <small className="text-white opacity-75">
                  Last updated: August 23, 2026
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div
                className="card border-0 shadow-sm rounded-4 sticky-lg-top"
                style={{ top: "20px" }}
              >
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <div
                      className="mx-auto mb-3 rounded-4 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
                      style={{
                        width: "65px",
                        height: "65px",
                      }}
                    >
                      <i className="bi bi-shield-check fs-2"></i>
                    </div>

                    <h5 className="fw-bold mb-2">
                      Your Agreement
                    </h5>

                    <p className="text-muted small mb-0">
                      These terms explain the rules and responsibilities
                      associated with using MediFlow.
                    </p>
                  </div>

                  <div className="p-3 rounded-4 bg-light mb-4">
                    <div className="d-flex gap-3 mb-3">
                      <div className="text-primary">
                        <i className="bi bi-check-circle-fill"></i>
                      </div>

                      <div>
                        <small className="fw-semibold">
                          Responsible Usage
                        </small>
                      </div>
                    </div>

                    <div className="d-flex gap-3 mb-3">
                      <div className="text-success">
                        <i className="bi bi-shield-lock-fill"></i>
                      </div>

                      <div>
                        <small className="fw-semibold">
                          Secure Access
                        </small>
                      </div>
                    </div>

                    <div className="d-flex gap-3">
                      <div className="text-info">
                        <i className="bi bi-building-check"></i>
                      </div>

                      <div>
                        <small className="fw-semibold">
                          Business Protection
                        </small>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/contact"
                    className="btn btn-primary w-100 rounded-3 py-2"
                  >
                    <i className="bi bi-headset me-2"></i>
                    Contact Support
                  </Link>

                  <Link
                    to="/privacy-policy"
                    className="btn btn-outline-secondary w-100 rounded-3 py-2 mt-2"
                  >
                    <i className="bi bi-lock me-2"></i>
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4 p-md-5">
                  <div className="alert alert-primary border-0 rounded-4 p-4 mb-5">
                    <div className="d-flex gap-3">
                      <div>
                        <i className="bi bi-info-circle-fill fs-4"></i>
                      </div>

                      <div>
                        <h6 className="fw-bold mb-2">
                          Please read carefully
                        </h6>

                        <p className="mb-0">
                          These Terms and Conditions establish the rules,
                          responsibilities, and conditions applicable to
                          your use of the MediFlow platform and related
                          services.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    {sections.map((section, index) => (
                      <div className="col-12" key={index}>
                        <div
                          className="terms-card p-4 rounded-4 border h-100"
                          style={{
                            background: "#ffffff",
                          }}
                        >
                          <div className="d-flex gap-3">
                            <div
                              className={`text-${section.color} bg-${section.color} bg-opacity-10 rounded-4 d-flex align-items-center justify-content-center flex-shrink-0`}
                              style={{
                                width: "52px",
                                height: "52px",
                              }}
                            >
                              <i
                                className={`bi ${section.icon} fs-4`}
                              ></i>
                            </div>

                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <span
                                  className={`badge text-${section.color} bg-${section.color} bg-opacity-10 rounded-pill`}
                                >
                                  {String(index + 1).padStart(2, "0")}
                                </span>

                                <h5 className="fw-bold mb-0">
                                  {section.title}
                                </h5>
                              </div>

                              <p className="text-muted lh-lg mb-0">
                                {section.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-5 p-4 p-md-5 rounded-4 text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #198754, #20c997)",
                    }}
                  >
                    <div className="row align-items-center">
                      <div className="col-md-2 text-center mb-3 mb-md-0">
                        <i
                          className="bi bi-hand-thumbs-up"
                          style={{ fontSize: "45px" }}
                        ></i>
                      </div>

                      <div className="col-md-10">
                        <h4 className="fw-bold mb-2">
                          Thank you for choosing MediFlow
                        </h4>

                        <p className="mb-0 opacity-75">
                          We are committed to providing a reliable,
                          secure, and useful platform for organizations
                          and their teams.
                        </p>
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
          .terms-card {
            transition: all 0.25s ease;
          }

          .terms-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.08);
            border-color: rgba(37,99,235,0.2) !important;
          }

          .terms-page .card {
            transition: box-shadow 0.25s ease;
          }

          .terms-page .card:hover {
            box-shadow: 0 12px 35px rgba(0,0,0,0.08) !important;
          }

          @media (max-width: 991px) {
            .sticky-lg-top {
              position: static !important;
            }
          }

          @media (max-width: 768px) {
            .display-4 {
              font-size: 2.3rem;
            }

            .terms-page .card-body {
              padding: 1.5rem !important;
            }

            .terms-card {
              padding: 1.25rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default TermsAndConditions;