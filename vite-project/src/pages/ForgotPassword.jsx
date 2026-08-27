import { useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../api/authApi'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await authApi.forgotPasswordApi(email)
      setMessage(response.message)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to request password reset')
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ background: "linear-gradient(135deg, var(--mf-bg) 0%, var(--mf-color-primary-subtle) 100%)" }}
    >
      <div className="container px-3">
        <div className="card border-0 shadow-lg rounded-4 mx-auto overflow-hidden" style={{ maxWidth: "460px" }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <div
                className="mx-auto mb-3 rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                style={{ width: "70px", height: "70px", fontSize: "28px" }}
              >
                <i className="bi bi-key-fill"></i>
              </div>
              <h3 className="fw-bold mb-2">Forgot Password</h3>
              <p className="text-muted mb-0">Enter your email and we'll send you a reset link.</p>
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
              <label className="form-label fw-semibold">Email Address</label>
              <div className="input-group mb-4">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-envelope text-muted"></i>
                </span>
                <input
                  className="form-control border-start-0"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary w-100 py-2 rounded-3 fw-semibold" type="submit">
                <i className="bi bi-send me-2"></i>
                Send reset link
              </button>
            </form>

            <div className="text-center mt-4">
              <Link className="text-decoration-none" to="/login">
                <i className="bi bi-arrow-left me-1"></i>
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
