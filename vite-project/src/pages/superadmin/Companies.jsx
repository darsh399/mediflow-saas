import { useState } from "react";
import { useNotify } from "../../components/NotificationProvider";
import BackButton from "../../components/BackButton";
import superAdminApi from "../../api/superAdminApi";

const Companies = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyMobile, setCompanyMobile] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [role, setRole] = useState("company_owner");
  const [plan, setPlan] = useState("1_YEAR");
  const [loading, setLoading] = useState(false);

  const { notify } = useNotify();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        companyName,
        companyEmail,
        companyMobile,
        ownerName,
        ownerEmail,
        ownerMobile,
        role,
        plan,
      };

      const resp = await superAdminApi.createCompany(payload);

      notify("Company created", `Invitation is being sent to ${ownerEmail}.`);

      setCompanyName("");
      setCompanyEmail("");
      setCompanyMobile("");
      setOwnerName("");
      setOwnerEmail("");
      setOwnerMobile("");
      setRole("company_owner");
      setPlan("1_YEAR");
    } catch (err) {
      console.error(err);

      notify(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create company"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="container py-4 py-lg-5">

        <div className="page-header mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

            <div>
              <div className="breadcrumb-wrapper mb-2">
                <BackButton />
                <span className="breadcrumb-separator">
                  <i className="bi bi-chevron-right"></i>
                </span>
                <span>Companies</span>
              </div>

              <h2 className="page-title mb-1">
                Create Company
              </h2>

              <p className="page-subtitle mb-0">
                Create a company and invite the owner to access the platform.
              </p>
            </div>

            <div className="page-icon">
              <i className="bi bi-building"></i>
            </div>

          </div>
        </div>

        <form onSubmit={submit}>

          <div className="row g-4">

            <div className="col-lg-8">

              <div className="form-card mb-4">

                <div className="card-header-custom">
                  <div className="section-icon primary">
                    <i className="bi bi-building"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Company Information
                    </h5>

                    <p className="text-muted small mb-0">
                      Enter the basic details of the company.
                    </p>
                  </div>
                </div>

                <div className="card-body-custom">

                  <div className="row g-4">

                    <div className="col-12">
                      <label className="form-label">
                        Company Name
                        <span className="optional-label">
                          Optional
                        </span>
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-building"></i>
                        </span>

                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter company name"
                          value={companyName}
                          onChange={(e) =>
                            setCompanyName(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Company Email
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-envelope"></i>
                        </span>

                        <input
                          type="email"
                          className="form-control"
                          placeholder="company@example.com"
                          value={companyEmail}
                          onChange={(e) =>
                            setCompanyEmail(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Company Mobile
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-telephone"></i>
                        </span>

                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Enter company mobile"
                          value={companyMobile}
                          onChange={(e) =>
                            setCompanyMobile(e.target.value)
                          }
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              <div className="form-card mb-4">

                <div className="card-header-custom">
                  <div className="section-icon success">
                    <i className="bi bi-person-badge"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Owner Information
                    </h5>

                    <p className="text-muted small mb-0">
                      Details of the person who will manage the company.
                    </p>
                  </div>
                </div>

                <div className="card-body-custom">

                  <div className="row g-4">

                    <div className="col-12">
                      <label className="form-label">
                        Owner Name
                        <span className="required">*</span>
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>

                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter owner name"
                          value={ownerName}
                          onChange={(e) =>
                            setOwnerName(e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Owner Email
                        <span className="required">*</span>
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-envelope"></i>
                        </span>

                        <input
                          type="email"
                          className="form-control"
                          placeholder="owner@example.com"
                          value={ownerEmail}
                          onChange={(e) =>
                            setOwnerEmail(e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Owner Mobile
                        <span className="required">*</span>
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-phone"></i>
                        </span>

                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Enter owner mobile"
                          value={ownerMobile}
                          onChange={(e) =>
                            setOwnerMobile(e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              <div className="form-card">

                <div className="card-header-custom">
                  <div className="section-icon purple">
                    <i className="bi bi-sliders"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Account Configuration
                    </h5>

                    <p className="text-muted small mb-0">
                      Configure the initial role and subscription plan.
                    </p>
                  </div>
                </div>

                <div className="card-body-custom">

                  <div className="row g-4">

                    <div className="col-md-6">
                      <label className="form-label">
                        Initial Role
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-person-gear"></i>
                        </span>

                        <select
                          className="form-select"
                          value={role}
                          onChange={(e) =>
                            setRole(e.target.value)
                          }
                        >
                          <option value="company_owner">
                            Company Owner
                          </option>

                          <option value="hr_manager">
                            HR Manager
                          </option>

                          <option value="hr">
                            HR
                          </option>

                          <option value="project_manager">
                            Project Manager
                          </option>

                          <option value="employee">
                            Employee
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Subscription Plan
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-calendar-check"></i>
                        </span>

                        <select
                          className="form-select"
                          value={plan}
                          onChange={(e) =>
                            setPlan(e.target.value)
                          }
                        >
                          <option value="3_YEAR">
                            3 Years
                          </option>

                          <option value="2_YEAR">
                            2 Years
                          </option>

                          <option value="1_YEAR">
                            1 Year
                          </option>

                          <option value="6_MONTHS">
                            6 Months
                          </option>

                          <option value="3_MONTHS">
                            3 Months
                          </option>

                          <option value="1_MONTH">
                            1 Month
                          </option>
                        </select>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

            <div className="col-lg-4">

              <div className="summary-card mb-4">

                <div className="summary-icon">
                  <i className="bi bi-send-check"></i>
                </div>

                <h5 className="fw-bold mb-2">
                  Invitation
                </h5>

                <p className="text-muted small mb-4">
                  Once the company is created, the owner will be invited
                  to access the platform using the provided email address.
                </p>

                <div className="summary-item">
                  <div className="summary-item-icon">
                    <i className="bi bi-person-check"></i>
                  </div>

                  <div>
                    <small className="text-muted d-block">
                      Owner
                    </small>

                    <span className="fw-semibold">
                      {ownerName || "Not provided"}
                    </span>
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-item-icon">
                    <i className="bi bi-envelope"></i>
                  </div>

                  <div>
                    <small className="text-muted d-block">
                      Email
                    </small>

                    <span className="fw-semibold text-break">
                      {ownerEmail || "Not provided"}
                    </span>
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-item-icon">
                    <i className="bi bi-calendar3"></i>
                  </div>

                  <div>
                    <small className="text-muted d-block">
                      Plan
                    </small>

                    <span className="fw-semibold">
                      {plan.replace("_", " ")}
                    </span>
                  </div>
                </div>

              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="bi bi-info-circle"></i>
                </div>

                <h6 className="fw-bold">
                  Before creating
                </h6>

                <p className="text-muted small mb-0">
                  Make sure the owner's email and mobile number are
                  correct. These details may be used for account
                  communication and platform access.
                </p>
              </div>

            </div>

          </div>

          <div className="form-actions mt-4">

            <button
              type="button"
              className="btn btn-light border action-cancel"
              onClick={() => window.history.back()}
              disabled={loading}
            >
              <i className="bi bi-x-lg me-2"></i>
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary action-create"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Creating Company...
                </>
              ) : (
                <>
                  <i className="bi bi-building-add me-2"></i>
                  Create Company & Invite Owner
                </>
              )}
            </button>

          </div>

        </form>
      </div>

      <style>{`
        .companies-page {
          min-height: 100vh;
          background: #f5f7fb;
          color: #212529;
        }

        .breadcrumb-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7a8494;
          font-size: 0.85rem;
        }

        .breadcrumb-wrapper > button {
          padding: 0;
        }

        .breadcrumb-separator {
          font-size: 0.65rem;
          color: #adb5bd;
        }

        .page-title {
          font-size: clamp(1.7rem, 3vw, 2.2rem);
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          color: #7a8494;
          font-size: 0.95rem;
        }

        .page-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
          font-size: 24px;
        }

        .form-card,
        .summary-card,
        .info-card {
          background: #fff;
          border: 1px solid #e7ebf1;
          border-radius: 18px;
          box-shadow: 0 5px 25px rgba(31, 41, 55, 0.04);
          overflow: hidden;
        }

        .card-header-custom {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px 25px;
          border-bottom: 1px solid #edf0f4;
        }

        .card-body-custom {
          padding: 25px;
        }

        .section-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          font-size: 19px;
        }

        .section-icon.primary {
          color: #0d6efd;
          background: rgba(13, 110, 253, 0.09);
        }

        .section-icon.success {
          color: #198754;
          background: rgba(25, 135, 84, 0.09);
        }

        .section-icon.purple {
          color: #6f42c1;
          background: rgba(111, 66, 193, 0.1);
        }

        .form-label {
          font-size: 0.86rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .required {
          color: #dc3545;
          margin-left: 3px;
        }

        .optional-label {
          color: #8a94a6;
          font-size: 0.72rem;
          font-weight: 500;
          margin-left: 7px;
        }

        .modern-input {
          border-radius: 11px;
          overflow: hidden;
        }

        .modern-input .input-group-text {
          min-width: 48px;
          justify-content: center;
          background: #f8f9fb;
          border-color: #dfe4ea;
          color: #7a8494;
        }

        .modern-input .form-control,
        .modern-input .form-select {
          min-height: 47px;
          border-color: #dfe4ea;
          box-shadow: none;
          font-size: 0.9rem;
        }

        .modern-input .form-control:focus,
        .modern-input .form-select:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
        }

        .modern-input:focus-within .input-group-text {
          border-color: #86b7fe;
          color: #0d6efd;
          background: rgba(13, 110, 253, 0.04);
        }

        .summary-card {
          padding: 25px;
        }

        .summary-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: rgba(13, 110, 253, 0.09);
          color: #0d6efd;
          font-size: 20px;
          margin-bottom: 18px;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-top: 1px solid #edf0f4;
        }

        .summary-item-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #f5f7fb;
          color: #0d6efd;
        }

        .info-card {
          padding: 22px;
        }

        .info-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(13, 110, 253, 0.08);
          color: #0d6efd;
          margin-bottom: 14px;
          font-size: 19px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          background: #fff;
          border: 1px solid #e7ebf1;
          border-radius: 16px;
          box-shadow: 0 5px 25px rgba(31, 41, 55, 0.04);
        }

        .action-cancel,
        .action-create {
          min-height: 46px;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
        }

        .action-create {
          min-width: 230px;
        }

        @media (max-width: 991.98px) {
          .page-icon {
            display: none;
          }
        }

        @media (max-width: 767.98px) {
          .companies-page .container {
            padding-left: 14px;
            padding-right: 14px;
          }

          .card-header-custom {
            padding: 18px;
          }

          .card-body-custom {
            padding: 18px;
          }

          .summary-card,
          .info-card {
            padding: 20px;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .action-cancel,
          .action-create {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .card-header-custom {
            align-items: flex-start;
          }

          .card-header-custom h5 {
            font-size: 1rem;
          }

          .card-header-custom p {
            font-size: 0.75rem;
          }

          .modern-input .form-control,
          .modern-input .form-select {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Companies;
