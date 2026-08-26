import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login as loginThunk } from "../redux/slices/authSlice";
import { useNotify } from "./NotificationProvider";
import { getDashboardRoute } from "../utils/dashboardRoute";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
} from "react-bootstrap";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    dispatch(loginThunk({ email, password }))
      .unwrap()
      .then((data) => {
        navigate(getDashboardRoute(data?.user?.role));
      })
      .catch((err) => {
        console.error("Login failed", err);
        notify(err?.message || "Login failed");
      });
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notify } = useNotify();

  return (
    <div
      className="min-vh-100 d-flex align-items-center position-relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #f5f7ff 0%, #eef3ff 45%, #f8f5ff 100%)",
      }}
    >
      <div
        className="position-absolute rounded-circle"
        style={{
          width: "420px",
          height: "420px",
          background: "rgba(13, 110, 253, 0.08)",
          top: "-180px",
          left: "-150px",
        }}
      />

      <div
        className="position-absolute rounded-circle"
        style={{
          width: "500px",
          height: "500px",
          background: "rgba(102, 16, 242, 0.07)",
          bottom: "-250px",
          right: "-200px",
        }}
      />

      <Container className="position-relative py-5">
        <Row className="justify-content-center align-items-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card
              className="border-0 shadow-lg"
              style={{
                borderRadius: "24px",
                overflow: "hidden",
              }}
            >
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center mx-auto mb-3 text-white fw-bold shadow-sm"
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "20px",
                      fontSize: "30px",
                      background:
                        "linear-gradient(135deg, #0d6efd, #6610f2)",
                    }}
                  >
                    M
                  </div>

                  <h2 className="fw-bold mb-2">
                    Welcome back
                  </h2>

                  <p className="text-muted mb-0">
                    Sign in to continue to your MediFlow account
                  </p>
                </div>

                <div
                  className="d-flex align-items-center gap-3 p-3 mb-4 rounded-3"
                  style={{
                    background: "#f4f7ff",
                    border: "1px solid #e5ebff",
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 text-primary"
                    style={{
                      width: "42px",
                      height: "42px",
                      background: "#e3ecff",
                    }}
                  >
                    <i className="bi bi-shield-check fs-5"></i>
                  </div>

                  <div>
                    <div className="fw-semibold small">
                      Secure Sign In
                    </div>

                    <div className="text-muted small">
                      Your account is protected with secure authentication
                    </div>
                  </div>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      Email Address
                    </Form.Label>

                    <InputGroup size="lg">
                      <InputGroup.Text
                        className="bg-white border-end-0"
                        style={{
                          borderColor: "#dee2e6",
                        }}
                      >
                        <i className="bi bi-envelope text-primary"></i>
                      </InputGroup.Text>

                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="border-start-0 ps-1"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="fw-semibold mb-0">
                        Password
                      </Form.Label>

                      <Link
                        to="/forgot-password"
                        className="text-primary text-decoration-none small fw-semibold"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <InputGroup size="lg">
                      <InputGroup.Text
                        className="bg-white border-end-0"
                        style={{
                          borderColor: "#dee2e6",
                        }}
                      >
                        <i className="bi bi-lock text-primary"></i>
                      </InputGroup.Text>

                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        className="border-start-0 border-end-0 ps-1"
                      />

                      <Button
                        variant="light"
                        type="button"
                        className="border border-start-0"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                      >
                        <i
                          className={`bi ${
                            showPassword
                              ? "bi-eye-slash"
                              : "bi-eye"
                          }`}
                        ></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      label="Remember me"
                    />

                    <span className="text-muted small">
                      Secure access
                    </span>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-100 border-0 fw-semibold py-3"
                    style={{
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, #0d6efd, #6610f2)",
                      boxShadow:
                        "0 8px 20px rgba(13, 110, 253, 0.25)",
                    }}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </Button>
                </Form>

              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <div className="d-flex justify-content-center gap-3 mb-2">
                <Link
                  to="/privacy"
                  className="text-muted text-decoration-none small"
                >
                  Privacy Policy
                </Link>

                <span className="text-muted">•</span>

                <Link
                  to="/terms"
                  className="text-muted text-decoration-none small"
                >
                  Terms & Conditions
                </Link>

                <span className="text-muted">•</span>

                <Link
                  to="/contact"
                  className="text-muted text-decoration-none small"
                >
                  Contact
                </Link>
              </div>

              <p className="text-muted small mb-0">
                © 2026 MediFlow. All rights reserved.
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      <style>
        {`
          .form-control,
          .input-group-text,
          .btn {
            transition: all 0.2s ease;
          }

          .form-control:focus {
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
            border-color: #86b7fe;
          }

          .btn:hover {
            transform: translateY(-1px);
          }

          .card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .card:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12) !important;
          }

          @media (max-width: 576px) {
            .card-body {
              padding: 1.5rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;