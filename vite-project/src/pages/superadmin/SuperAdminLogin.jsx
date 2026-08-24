import { useState } from "react";
import superAdminApi from "../../api/superAdminApi";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice";
import { useNotify } from "../../components/NotificationProvider";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notify } = useNotify();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const data = await superAdminApi.login({
        email,
        password,
      });

      if (data.token && data.user) {
        if (data.user.role !== "super_admin") {
          return notify("Not a super admin");
        }

        dispatch(
          setCredentials({
            user: data.user,
            token: data.token,
          })
        );

        navigate("/superadmin/dashboard");
      }
    } catch (err) {
      console.error(err);

      notify(
        err?.response?.data?.message ||
          err?.message ||
          "Login failed"
      );
    }
  };

  return (
    <div className="super-admin-login-page">
      <div className="container py-5">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">

            <div className="login-card">

              <div className="login-header">
                <div className="login-icon">
                  <i className="bi bi-shield-lock"></i>
                </div>

                <h2 className="fw-bold mb-2">
                  Super Admin Login
                </h2>

                <p className="text-muted mb-0">
                  Sign in to access the administration panel
                </p>
              </div>

              <form onSubmit={submit}>

                <div className="mb-4">
                  <label className="form-label">
                    Email Address
                  </label>

                  <div className="input-group login-input">
                    <span className="input-group-text">
                      <i className="bi bi-envelope"></i>
                    </span>

                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    Password
                  </label>

                  <div className="input-group login-input">
                    <span className="input-group-text">
                      <i className="bi bi-lock"></i>
                    </span>

                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 login-button"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </button>

              </form>

              <div className="login-footer">
                <i className="bi bi-shield-check me-1"></i>
                Secure Super Admin Access
              </div>

            </div>

          </div>
        </div>
      </div>

      <style>{`
        .super-admin-login-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top left,
              rgba(13, 110, 253, 0.08),
              transparent 35%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(111, 66, 193, 0.08),
              transparent 35%
            ),
            #f5f7fb;
        }

        .login-card {
          background: #ffffff;
          border: 1px solid #e7ebf1;
          border-radius: 20px;
          padding: 35px;
          box-shadow: 0 15px 45px rgba(31, 41, 55, 0.08);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
          font-size: 29px;
        }

        .login-header h2 {
          font-size: 1.65rem;
          color: #212529;
        }

        .login-header p {
          font-size: 0.9rem;
        }

        .form-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .login-input {
          border-radius: 11px;
          overflow: hidden;
        }

        .login-input .input-group-text {
          min-width: 48px;
          justify-content: center;
          background: #f8f9fb;
          border-color: #dfe4ea;
          color: #7a8494;
        }

        .login-input .form-control {
          min-height: 48px;
          border-color: #dfe4ea;
          box-shadow: none;
          font-size: 0.9rem;
        }

        .login-input .form-control:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
        }

        .login-input:focus-within .input-group-text {
          border-color: #86b7fe;
          color: #0d6efd;
          background: rgba(13, 110, 253, 0.04);
        }

        .login-button {
          min-height: 48px;
          border-radius: 11px;
          font-weight: 600;
          box-shadow: 0 5px 15px rgba(13, 110, 253, 0.2);
          transition: all 0.2s ease;
        }

        .login-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(13, 110, 253, 0.25);
        }

        .login-footer {
          margin-top: 25px;
          padding-top: 18px;
          border-top: 1px solid #edf0f4;
          text-align: center;
          color: #7a8494;
          font-size: 0.78rem;
        }

        @media (max-width: 575.98px) {
          .super-admin-login-page .container {
            padding-left: 14px;
            padding-right: 14px;
          }

          .login-card {
            padding: 25px 20px;
            border-radius: 16px;
          }

          .login-header {
            margin-bottom: 25px;
          }

          .login-header h2 {
            font-size: 1.4rem;
          }

          .login-icon {
            width: 60px;
            height: 60px;
            font-size: 25px;
          }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminLogin;