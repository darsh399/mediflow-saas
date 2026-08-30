// import { useState } from 'react'
// import { Link, useNavigate, useSearchParams } from 'react-router-dom'
// import authApi from '../api/authApi'

// const ResetPassword = () => {
//   const [search] = useSearchParams()
//   const token = search.get('token')
//   const [password, setPassword] = useState('')
//   const [confirm, setConfirm] = useState('')
//   const [message, setMessage] = useState('')
//   const [error, setError] = useState('')
//   const navigate = useNavigate()

//   const submit = async (event) => {
//     event.preventDefault()
//     setError('')
//     if (!token) return setError('Reset token is missing')
//     if (password.length < 8 || password !== confirm) return setError('Passwords must match and be at least 8 characters')
//     try {
//       const response = await authApi.resetPasswordApi(token, password)
//       setMessage(response.message)
//       setTimeout(() => navigate('/login'), 800)
//     } catch (err) {
//       setError(err?.response?.data?.message || 'Unable to reset password')
//     }
//   }

//   return <div className="container my-5" style={{ maxWidth: 520 }}>
//     <h3>Reset Password</h3>
//     {message && <div className="alert alert-success">{message}</div>}
//     {error && <div className="alert alert-danger">{error}</div>}
//     <form onSubmit={submit}>
//       <label className="form-label">New password</label>
//       <input className="form-control mb-3" type="password" value={password} onChange={event => setPassword(event.target.value)} required />
//       <label className="form-label">Confirm password</label>
//       <input className="form-control mb-3" type="password" value={confirm} onChange={event => setConfirm(event.target.value)} required />
//       <button className="btn btn-primary">Reset password</button>
//     </form>
//     <Link className="d-block mt-3" to="/login">Back to login</Link>
//   </div>
// }

// export default ResetPassword



import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import authApi from "../api/authApi";
import { updateUser } from "../redux/slices/authSlice";

const ResetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const forced = useSelector((state) => state.auth.user?.passwordChangeRequired);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await authApi.changePasswordApi({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMessage(
        response?.message ||
          "Password changed successfully."
      );

      dispatch(updateUser({ passwordChangeRequired: false }));

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = form.newPassword;

    if (!password) {
      return {
        label: "",
        className: "",
      };
    }

    if (password.length < 8) {
      return {
        label: "Weak",
        className: "text-danger",
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (
      password.length >= 8 &&
      hasUppercase &&
      hasNumber &&
      hasSpecial
    ) {
      return {
        label: "Strong",
        className: "text-success",
      };
    }

    return {
      label: "Medium",
      className: "text-warning",
    };
  };

  const strength = getPasswordStrength();

  return (
    <div
      className="change-password-page min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{
        background:
          "linear-gradient(135deg, var(--mf-bg) 0%, var(--mf-color-primary-subtle) 100%)",
      }}
    >
      <div className="container px-3">
        <div
          className="card border-0 shadow-lg rounded-4 mx-auto overflow-hidden"
          style={{ maxWidth: "520px" }}
        >
          <div className="card-body p-4 p-md-5">

            <div className="text-center mb-4">
              <div
                className="mx-auto mb-3 rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                style={{
                  width: "70px",
                  height: "70px",
                  fontSize: "28px",
                }}
              >
                <i className="bi bi-shield-lock-fill"></i>
              </div>

              <h3 className="fw-bold mb-2">
                {forced ? "Set a New Password" : "Change Password"}
              </h3>

              <p className="text-muted mb-0">
                {forced
                  ? "For your security, you must change your temporary password before you can continue."
                  : "Update your password securely by confirming your current password first."}
              </p>
            </div>

            {message && (
              <div className="alert alert-success border-0 rounded-3">
                <i className="bi bi-check-circle-fill me-2"></i>
                {message}
              </div>
            )}

            {error && (
              <div className="alert alert-danger border-0 rounded-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={submit}>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Current Password
                </label>

                <div className="input-group password-input">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-muted"></i>
                  </span>

                  <input
                    type={showCurrent ? "text" : "password"}
                    name="currentPassword"
                    className="form-control border-start-0 border-end-0"
                    placeholder="Enter current password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0"
                    onClick={() =>
                      setShowCurrent((value) => !value)
                    }
                  >
                    <i
                      className={`bi ${
                        showCurrent
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    ></i>
                  </button>
                </div>

                <small className="text-muted">
                  Enter the password you currently use to login.
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  New Password
                </label>

                <div className="input-group password-input">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-key text-muted"></i>
                  </span>

                  <input
                    type={showNew ? "text" : "password"}
                    name="newPassword"
                    className="form-control border-start-0 border-end-0"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />

                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0"
                    onClick={() =>
                      setShowNew((value) => !value)
                    }
                  >
                    <i
                      className={`bi ${
                        showNew
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    ></i>
                  </button>
                </div>

                {strength.label && (
                  <div className="mt-2">
                    <small className={strength.className}>
                      Password strength:{" "}
                      <strong>{strength.label}</strong>
                    </small>
                  </div>
                )}

                <small className="text-muted d-block mt-1">
                  Use at least 8 characters.
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Confirm New Password
                </label>

                <div className="input-group password-input">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-shield-check text-muted"></i>
                  </span>

                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    className="form-control border-start-0 border-end-0"
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />

                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0"
                    onClick={() =>
                      setShowConfirm((value) => !value)
                    }
                  >
                    <i
                      className={`bi ${
                        showConfirm
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    ></i>
                  </button>
                </div>

                {form.confirmPassword && (
                  <small
                    className={
                      form.newPassword ===
                      form.confirmPassword
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    <i
                      className={`bi ${
                        form.newPassword ===
                        form.confirmPassword
                          ? "bi-check-circle"
                          : "bi-x-circle"
                      } me-1`}
                    ></i>

                    {form.newPassword ===
                    form.confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </small>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 rounded-3 fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check me-2"></i>
                    Change Password
                  </>
                )}
              </button>
            </form>

            {!forced && (
              <div className="text-center mt-4">
                <Link
                  to="/profile"
                  className="text-decoration-none"
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Profile
                </Link>
              </div>
            )}

          </div>

          <div className="bg-light border-top p-3 text-center">
            <small className="text-muted">
              <i className="bi bi-shield-check me-1"></i>
              Your password is securely verified before it is
              changed.
            </small>
          </div>
        </div>
      </div>

      <style>{`
        .password-input .form-control {
          min-height: 45px;
        }

        .password-input .input-group-text {
          min-width: 45px;
          justify-content: center;
        }

        .password-input button {
          border: 1px solid var(--mf-border);
          cursor: pointer;
        }

        .password-input button:hover {
          background-color: var(--mf-slate-100) !important;
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 148, 136, 0.15);
          border-color: var(--mf-color-primary);
        }

        .btn-primary {
          transition: all 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;