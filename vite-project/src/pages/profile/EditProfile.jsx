import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import userApi from "../../api/userApi";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const auth = useSelector((s) => s.auth);
  const user = auth?.user;

  const [form, setForm] = useState({
    fatherName: "",
    dob: "",
    gender: "",
    mobileAlternate: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    line1: "",
    city: "",
    designation: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const nav = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setFetching(false);
        return;
      }

      try {
        const id = user.id || user._id;

        const data = await userApi.fetchUser(id);
        const u = data.user || data;
        const p = u.profile || {};

        setForm({
          fatherName: p.fatherName || "",
          dob: p.dob
            ? new Date(p.dob).toISOString().slice(0, 10)
            : "",
          gender: p.gender || "",
          mobileAlternate: p.mobileAlternate || "",
          emergencyContactName: p.emergencyContact?.name || "",
          emergencyContactPhone: p.emergencyContact?.phone || "",
          line1: p.currentAddress?.line1 || "",
          city: p.currentAddress?.city || "",
          designation: p.jobDetails?.designation || "",
        });
      } catch (err) {
        console.error("Profile loading error:", err);
        setError("Unable to load your profile information.");
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess("");

    try {
      const id = user.id || user._id;

      const payload = {
        fatherName: form.fatherName,
        dob: form.dob || null,
        gender: form.gender,
        mobileAlternate: form.mobileAlternate,
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
        },
        currentAddress: {
          line1: form.line1,
          city: form.city,
        },
        jobDetails: {
          designation: form.designation,
        },
      };

      await userApi.updateProfile(id, payload);

      setSuccess("Your profile has been updated successfully.");

      setTimeout(() => {
        nav("/profile");
      }, 1000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="edit-profile-page">
        <div className="container py-5">
          <div className="alert alert-warning border-0 shadow-sm rounded-4">
            <div className="d-flex align-items-center gap-3">
              <div className="edit-alert-icon warning">
                <i className="bi bi-exclamation-triangle"></i>
              </div>

              <div>
                <h6 className="fw-bold mb-1">
                  Authentication Required
                </h6>

                <p className="mb-0 text-muted">
                  Please sign in to edit your profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="edit-profile-page">
        <div className="container py-5">
          <div className="edit-loading-card">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            <h5 className="fw-bold mb-1">
              Loading Profile
            </h5>

            <p className="text-muted mb-0">
              Please wait while we load your information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <div className="container py-4 py-lg-5">
        <div className="edit-page-header mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="edit-breadcrumb mb-2">
                <button
                  type="button"
                  onClick={() => nav("/profile")}
                  className="breadcrumb-link"
                >
                  <i className="bi bi-person me-1"></i>
                  My Profile
                </button>

                <i className="bi bi-chevron-right mx-2"></i>

                <span>Edit Profile</span>
              </div>

              <h2 className="edit-title">
                Edit Profile
              </h2>

              <p className="edit-subtitle mb-0">
                Update your personal and professional information.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary edit-back-btn"
              onClick={() => nav("/profile")}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Profile
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger edit-alert border-0 shadow-sm mb-4">
            <div className="d-flex align-items-start gap-3">
              <div className="edit-alert-icon danger">
                <i className="bi bi-exclamation-circle"></i>
              </div>

              <div>
                <h6 className="fw-bold mb-1">
                  Update Failed
                </h6>

                <div>{error}</div>
              </div>

              <button
                type="button"
                className="btn-close ms-auto"
                onClick={() => setError(null)}
              ></button>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success edit-alert border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="edit-alert-icon success">
                <i className="bi bi-check-lg"></i>
              </div>

              <div>
                <h6 className="fw-bold mb-1">
                  Profile Updated
                </h6>

                <div>{success}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="profile-side-card mb-4">
                <div className="profile-side-cover"></div>

                <div className="profile-side-body">
                  <div className="profile-avatar">
                    {(user.name || user.email || "U")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h5 className="fw-bold mb-1">
                    {user.name || "User"}
                  </h5>

                  <p className="text-muted small mb-3 text-break">
                    {user.email || "-"}
                  </p>

                  <span className="profile-role">
                    <i className="bi bi-shield-check me-1"></i>
                    {user.role
                      ? user.role
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1)
                          )
                          .join(" ")
                      : "User"}
                  </span>
                </div>
              </div>

              <div className="profile-help-card">
                <div className="help-icon">
                  <i className="bi bi-info-circle"></i>
                </div>

                <h6 className="fw-bold">
                  Profile Information
                </h6>

                <p className="text-muted small mb-0">
                  Keep your personal and professional information
                  up to date so your organization can maintain
                  accurate employee records.
                </p>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="edit-card mb-4">
                <div className="edit-card-header">
                  <div className="section-icon primary">
                    <i className="bi bi-person-vcard"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Personal Information
                    </h5>

                    <p className="text-muted small mb-0">
                      Basic personal details
                    </p>
                  </div>
                </div>

                <div className="edit-card-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label">
                        Father Name
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>

                        <input
                          type="text"
                          name="fatherName"
                          value={form.fatherName}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter father name"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Date of Birth
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-calendar3"></i>
                        </span>

                        <input
                          type="date"
                          name="dob"
                          value={form.dob}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Gender
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-gender-ambiguous"></i>
                        </span>

                        <select
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="">
                            Select gender
                          </option>

                          <option value="male">
                            Male
                          </option>

                          <option value="female">
                            Female
                          </option>

                          <option value="other">
                            Other
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Alternate Mobile
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-phone"></i>
                        </span>

                        <input
                          type="tel"
                          name="mobileAlternate"
                          value={form.mobileAlternate}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter alternate mobile"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="edit-card mb-4">
                <div className="edit-card-header">
                  <div className="section-icon danger">
                    <i className="bi bi-heart-pulse"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Emergency Contact
                    </h5>

                    <p className="text-muted small mb-0">
                      Contact details for emergency situations
                    </p>
                  </div>
                </div>

                <div className="edit-card-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label">
                        Contact Name
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>

                        <input
                          type="text"
                          name="emergencyContactName"
                          value={form.emergencyContactName}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Emergency contact name"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Contact Phone
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-telephone"></i>
                        </span>

                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={form.emergencyContactPhone}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Emergency contact number"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="edit-card mb-4">
                <div className="edit-card-header">
                  <div className="section-icon warning">
                    <i className="bi bi-geo-alt"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Current Address
                    </h5>

                    <p className="text-muted small mb-0">
                      Your current residential address
                    </p>
                  </div>
                </div>

                <div className="edit-card-body">
                  <div className="row g-4">
                    <div className="col-12">
                      <label className="form-label">
                        Address Line
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-house"></i>
                        </span>

                        <input
                          type="text"
                          name="line1"
                          value={form.line1}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        City
                      </label>

                      <div className="input-group modern-input">
                        <span className="input-group-text">
                          <i className="bi bi-buildings"></i>
                        </span>

                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="edit-card mb-4">
                <div className="edit-card-header">
                  <div className="section-icon purple">
                    <i className="bi bi-briefcase"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Professional Information
                    </h5>

                    <p className="text-muted small mb-0">
                      Your current employment information
                    </p>
                  </div>
                </div>

                <div className="edit-card-body">
                  <label className="form-label">
                    Designation
                  </label>

                  <div className="input-group modern-input">
                    <span className="input-group-text">
                      <i className="bi bi-person-workspace"></i>
                    </span>

                    <input
                      type="text"
                      name="designation"
                      value={form.designation}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Enter your designation"
                    />
                  </div>
                </div>
              </div>

              <div className="edit-actions">
                <button
                  type="button"
                  className="btn btn-light border action-cancel"
                  onClick={() => nav("/profile")}
                  disabled={loading}
                >
                  <i className="bi bi-x-lg me-2"></i>
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary action-save"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-2"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .edit-profile-page {
          min-height: 100vh;
          background: #f5f7fb;
          color: #212529;
        }

        .edit-page-header {
          background: transparent;
        }

        .edit-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          color: #8a94a6;
          font-size: 0.85rem;
        }

        .breadcrumb-link {
          border: 0;
          background: transparent;
          padding: 0;
          color: #6c757d;
          font-size: inherit;
          cursor: pointer;
        }

        .breadcrumb-link:hover {
          color: #0d6efd;
        }

        .edit-title {
          font-size: clamp(1.7rem, 3vw, 2.2rem);
          font-weight: 700;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .edit-subtitle {
          color: #7a8494;
          font-size: 0.95rem;
        }

        .edit-back-btn {
          border-radius: 10px;
          padding: 10px 17px;
          font-weight: 500;
          background: #fff;
        }

        .profile-side-card {
          overflow: hidden;
          background: #fff;
          border: 1px solid #e9edf3;
          border-radius: 18px;
          box-shadow: 0 5px 25px rgba(31, 41, 55, 0.05);
        }

        .profile-side-cover {
          height: 105px;
          background: linear-gradient(
            135deg,
            #0d6efd 0%,
            #6610f2 100%
          );
        }

        .profile-side-body {
          position: relative;
          padding: 55px 25px 25px;
          text-align: center;
        }

        .profile-avatar {
          position: absolute;
          top: -48px;
          left: 50%;
          transform: translateX(-50%);
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #fff;
          border: 5px solid #fff;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          color: #0d6efd;
          font-size: 36px;
          font-weight: 700;
        }

        .profile-role {
          display: inline-flex;
          align-items: center;
          padding: 7px 14px;
          border-radius: 50px;
          background: rgba(13, 110, 253, 0.08);
          color: #0d6efd;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .profile-help-card {
          background: #fff;
          border: 1px solid #e9edf3;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 5px 25px rgba(31, 41, 55, 0.04);
        }

        .help-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          border-radius: 12px;
          background: rgba(13, 110, 253, 0.08);
          color: #0d6efd;
          font-size: 20px;
        }

        .edit-card {
          background: #fff;
          border: 1px solid #e7ebf1;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 5px 25px rgba(31, 41, 55, 0.04);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .edit-card:hover {
          box-shadow: 0 10px 30px rgba(31, 41, 55, 0.07);
        }

        .edit-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px 25px;
          border-bottom: 1px solid #edf0f4;
        }

        .edit-card-body {
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

        .section-icon.danger {
          color: #dc3545;
          background: rgba(220, 53, 69, 0.09);
        }

        .section-icon.warning {
          color: #f59f00;
          background: rgba(245, 159, 0, 0.1);
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

        .modern-input {
          border-radius: 11px;
          overflow: hidden;
        }

        .modern-input .input-group-text {
          background: #f8f9fb;
          border-color: #dfe4ea;
          color: #7a8494;
          min-width: 46px;
          justify-content: center;
        }

        .modern-input .form-control,
        .modern-input .form-select {
          min-height: 46px;
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

        .edit-actions {
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
        .action-save {
          min-height: 46px;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
        }

        .action-save {
          min-width: 160px;
        }

        .edit-alert {
          border-radius: 14px;
          padding: 16px 18px;
        }

        .edit-alert-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 18px;
        }

        .edit-alert-icon.warning {
          color: #856404;
          background: rgba(255, 193, 7, 0.15);
        }

        .edit-alert-icon.danger {
          color: #dc3545;
          background: rgba(220, 53, 69, 0.1);
        }

        .edit-alert-icon.success {
          color: #198754;
          background: rgba(25, 135, 84, 0.1);
        }

        .edit-loading-card {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #e7ebf1;
          border-radius: 18px;
          box-shadow: 0 5px 25px rgba(31, 41, 55, 0.05);
        }

        @media (max-width: 991.98px) {
          .profile-side-card {
            margin-bottom: 0;
          }

          .profile-help-card {
            display: none;
          }
        }

        @media (max-width: 767.98px) {
          .edit-profile-page .container {
            padding-left: 14px;
            padding-right: 14px;
          }

          .edit-page-header {
            margin-bottom: 20px;
          }

          .edit-title {
            font-size: 1.65rem;
          }

          .edit-back-btn {
            width: 100%;
          }

          .edit-card-header {
            padding: 18px;
          }

          .edit-card-body {
            padding: 18px;
          }

          .section-icon {
            width: 42px;
            height: 42px;
            min-width: 42px;
          }

          .edit-actions {
            flex-direction: column-reverse;
          }

          .action-cancel,
          .action-save {
            width: 100%;
          }

          .profile-side-body {
            padding-left: 18px;
            padding-right: 18px;
          }
        }

        @media (max-width: 420px) {
          .edit-card-header {
            align-items: flex-start;
          }

          .edit-card-header h5 {
            font-size: 1rem;
          }

          .edit-card-header p {
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

export default EditProfile;