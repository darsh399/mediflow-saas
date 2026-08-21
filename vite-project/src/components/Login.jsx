import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login as loginThunk } from '../redux/slices/authSlice'
import { useNotify } from './NotificationProvider'
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

  const getDashboardPath = (role) => {
    switch (role) {
      case 'super_admin':
        return '/superadmin/dashboard'
      case 'company_owner':
      case 'manager':
      case 'project_manager':
        return '/admin'
      case 'hr':
      case 'hr_manager':
        return '/hr/leaves'
      case 'employee':
      case 'mr':
        return '/mr/add-visit'
      default:
        return '/'
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target
    const email = form.querySelector('input[type="email"]').value
    const password = form.querySelector('input[type="password"]').value
    dispatch(loginThunk({ email, password }))
      .unwrap()
      .then((data)=>{
        navigate(getDashboardPath(data?.user?.role))
      })
      .catch(err=>{
        console.error('Login failed', err)
        notify(err?.message || 'Login failed')
      })
  };

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { notify } = useNotify()

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={7} lg={5} xl={4}>

            <Card className="border-0 shadow-lg rounded-4">
              <Card.Body className="p-4 p-md-5">

                {/* Logo */}
                <div className="text-center mb-4">

                  <div
                    className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: "55px",
                      height: "55px",
                      fontSize: "24px",
                      fontWeight: "700",
                    }}
                  >
                    M
                  </div>

                  <h3 className="fw-bold mb-1">
                    Welcome Back
                  </h3>

                  <p className="text-secondary mb-0">
                    Sign in to your account
                  </p>

                </div>

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>

                  {/* Email */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Email Address
                    </Form.Label>

                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      size="lg"
                      required
                    />
                  </Form.Group>

                  {/* Password */}
                  <Form.Group className="mb-3">

                    <div className="d-flex justify-content-between">
                      <Form.Label className="fw-semibold">
                        Password
                      </Form.Label>

                      <Link
                        to="/forgot-password"
                        className="text-decoration-none small"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <InputGroup>

                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        size="lg"
                        required
                      />

                      <Button
                        variant="outline-secondary"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        type="button"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </Button>

                    </InputGroup>

                  </Form.Group>

                  {/* Remember Me */}
                  <Form.Check
                    type="checkbox"
                    label="Remember me"
                    className="mb-4"
                  />

                  {/* Login Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 fw-semibold"
                  >
                    Sign In
                  </Button>

                </Form>

                {/* Register */}
                <div className="text-center mt-4">

                  <span className="text-secondary">
                    Don't have an account?{" "}
                  </span>

                  <Link
                    to="/signup"
                    className="fw-semibold text-decoration-none"
                  >
                    Get Started
                  </Link>

                </div>

              </Card.Body>
            </Card>

            {/* Footer */}
            <p className="text-center text-secondary small mt-4">
              © 2026 MediFlow. All rights reserved.
            </p>

          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;