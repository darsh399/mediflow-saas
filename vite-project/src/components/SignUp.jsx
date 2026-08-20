import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from '../api/authApi'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../redux/slices/authSlice'
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

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target
    const name = form.querySelector('input[type="text"]').value
    const email = form.querySelector('input[type="email"]').value
    const mobile = form.querySelector('input[type="tel"]').value
    const password = form.querySelector('input[type="password"]').value

    authApi.registerApi({ name, email, mobile, password })
      .then(resp=>{
        // if backend returns token and user, set credentials
        if (resp.token && resp.user) {
          dispatch(setCredentials({ user: resp.user, token: resp.token }))
        }
        navigate('/')
      })
      .catch(err=>{
        console.error('Signup failed', err)
        notify(err?.response?.data?.message || err?.message || 'Signup failed')
      })
  };

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { notify } = useNotify()

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center py-5">

      <Container>
        <Row className="justify-content-center">

          <Col xs={12} sm={11} md={8} lg={6} xl={5}>

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
                    Create Your Account
                  </h3>

                  <p className="text-secondary mb-0">
                    Start managing your business with MediFlow
                  </p>

                </div>

                <Form onSubmit={handleSubmit}>

                  {/* Company Name */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Company Name
                    </Form.Label>

                    <Form.Control
                      type="text"
                      placeholder="Enter company name"
                      size="lg"
                      required
                    />
                  </Form.Group>

                  {/* Owner Name */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Owner Name
                    </Form.Label>

                    <Form.Control
                      type="text"
                      placeholder="Enter owner name"
                      size="lg"
                      required
                    />
                  </Form.Group>

                  {/* Email */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Email Address
                    </Form.Label>

                    <Form.Control
                      type="email"
                      placeholder="Enter business email"
                      size="lg"
                      required
                    />
                  </Form.Group>

                  {/* Mobile */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Mobile Number
                    </Form.Label>

                    <Form.Control
                      type="tel"
                      placeholder="Enter mobile number"
                      size="lg"
                      required
                    />
                  </Form.Group>

                  {/* Password */}
                  <Form.Group className="mb-3">

                    <Form.Label className="fw-semibold">
                      Password
                    </Form.Label>

                    <InputGroup>

                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        size="lg"
                        required
                        minLength={8}
                      />

                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                      >
                        {showPassword ? "Hide" : "Show"}
                      </Button>

                    </InputGroup>

                    <Form.Text className="text-secondary">
                      Minimum 8 characters
                    </Form.Text>

                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-3">

                    <Form.Label className="fw-semibold">
                      Confirm Password
                    </Form.Label>

                    <InputGroup>

                      <Form.Control
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Confirm password"
                        size="lg"
                        required
                      />

                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      >
                        {showConfirmPassword
                          ? "Hide"
                          : "Show"}
                      </Button>

                    </InputGroup>

                  </Form.Group>

                  {/* Terms */}
                  <Form.Check
                    type="checkbox"
                    required
                    className="mb-4"
                    label={
                      <>
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-decoration-none"
                        >
                          Terms & Conditions
                        </Link>
                      </>
                    }
                  />

                  {/* Signup Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 fw-semibold"
                  >
                    Create Account
                  </Button>

                </Form>

                {/* Login */}
                <div className="text-center mt-4">

                  <span className="text-secondary">
                    Already have an account?{" "}
                  </span>

                  <Link
                    to="/login"
                    className="fw-semibold text-decoration-none"
                  >
                    Sign In
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

export default Signup;