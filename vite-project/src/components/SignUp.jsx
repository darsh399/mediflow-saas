// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import authApi from '../api/authApi'
// import { useDispatch } from 'react-redux'
// import { setCredentials } from '../redux/slices/authSlice'
// import { useNotify } from './NotificationProvider'
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Form,
//   Button,
//   InputGroup,
// } from "react-bootstrap";

// const Signup = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const form = e.target
//     const name = form.querySelector('input[type="text"]').value
//     const email = form.querySelector('input[type="email"]').value
//     const mobile = form.querySelector('input[type="tel"]').value
//     const password = form.querySelector('input[type="password"]').value

//     authApi.registerApi({ name, email, mobile, password })
//       .then(resp=>{
//         // if backend returns token and user, set credentials
//         if (resp.token && resp.user) {
//           dispatch(setCredentials({ user: resp.user, token: resp.token }))
//         }
//         navigate('/')
//       })
//       .catch(err=>{
//         console.error('Signup failed', err)
//         notify(err?.response?.data?.message || err?.message || 'Signup failed')
//       })
//   };

//   const navigate = useNavigate()
//   const dispatch = useDispatch()
//   const { notify } = useNotify()

//   return (
//     <div className="min-vh-100 bg-light d-flex align-items-center py-5">

//       <Container>
//         <Row className="justify-content-center">

//           <Col xs={12} sm={11} md={8} lg={6} xl={5}>

//             <Card className="border-0 shadow-lg rounded-4">

//               <Card.Body className="p-4 p-md-5">

//                 {/* Logo */}
//                 <div className="text-center mb-4">

//                   <div
//                     className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center mx-auto mb-3"
//                     style={{
//                       width: "55px",
//                       height: "55px",
//                       fontSize: "24px",
//                       fontWeight: "700",
//                     }}
//                   >
//                     M
//                   </div>

//                   <h3 className="fw-bold mb-1">
//                     Create Your Account
//                   </h3>

//                   <p className="text-secondary mb-0">
//                     Start managing your business with MediFlow
//                   </p>

//                 </div>

//                 <Form onSubmit={handleSubmit}>

//                   {/* Company Name */}
//                   <Form.Group className="mb-3">
//                     <Form.Label className="fw-semibold">
//                       Company Name
//                     </Form.Label>

//                     <Form.Control
//                       type="text"
//                       placeholder="Enter company name"
//                       size="lg"
//                       required
//                     />
//                   </Form.Group>

//                   {/* Owner Name */}
//                   <Form.Group className="mb-3">
//                     <Form.Label className="fw-semibold">
//                       Owner Name
//                     </Form.Label>

//                     <Form.Control
//                       type="text"
//                       placeholder="Enter owner name"
//                       size="lg"
//                       required
//                     />
//                   </Form.Group>

//                   {/* Email */}
//                   <Form.Group className="mb-3">
//                     <Form.Label className="fw-semibold">
//                       Email Address
//                     </Form.Label>

//                     <Form.Control
//                       type="email"
//                       placeholder="Enter business email"
//                       size="lg"
//                       required
//                     />
//                   </Form.Group>

//                   {/* Mobile */}
//                   <Form.Group className="mb-3">
//                     <Form.Label className="fw-semibold">
//                       Mobile Number
//                     </Form.Label>

//                     <Form.Control
//                       type="tel"
//                       placeholder="Enter mobile number"
//                       size="lg"
//                       required
//                     />
//                   </Form.Group>

//                   {/* Password */}
//                   <Form.Group className="mb-3">

//                     <Form.Label className="fw-semibold">
//                       Password
//                     </Form.Label>

//                     <InputGroup>

//                       <Form.Control
//                         type={showPassword ? "text" : "password"}
//                         placeholder="Create password"
//                         size="lg"
//                         required
//                         minLength={8}
//                       />

//                       <Button
//                         variant="outline-secondary"
//                         type="button"
//                         onClick={() =>
//                           setShowPassword(!showPassword)
//                         }
//                       >
//                         {showPassword ? "Hide" : "Show"}
//                       </Button>

//                     </InputGroup>

//                     <Form.Text className="text-secondary">
//                       Minimum 8 characters
//                     </Form.Text>

//                   </Form.Group>

//                   {/* Confirm Password */}
//                   <Form.Group className="mb-3">

//                     <Form.Label className="fw-semibold">
//                       Confirm Password
//                     </Form.Label>

//                     <InputGroup>

//                       <Form.Control
//                         type={
//                           showConfirmPassword
//                             ? "text"
//                             : "password"
//                         }
//                         placeholder="Confirm password"
//                         size="lg"
//                         required
//                       />

//                       <Button
//                         variant="outline-secondary"
//                         type="button"
//                         onClick={() =>
//                           setShowConfirmPassword(
//                             !showConfirmPassword
//                           )
//                         }
//                       >
//                         {showConfirmPassword
//                           ? "Hide"
//                           : "Show"}
//                       </Button>

//                     </InputGroup>

//                   </Form.Group>

//                   {/* Terms */}
//                   <Form.Check
//                     type="checkbox"
//                     required
//                     className="mb-4"
//                     label={
//                       <>
//                         I agree to the{" "}
//                         <Link
//                           to="/terms"
//                           className="text-decoration-none"
//                         >
//                           Terms & Conditions
//                         </Link>
//                       </>
//                     }
//                   />

//                   {/* Signup Button */}
//                   <Button
//                     type="submit"
//                     variant="primary"
//                     size="lg"
//                     className="w-100 fw-semibold"
//                   >
//                     Create Account
//                   </Button>

//                 </Form>

//                 {/* Login */}
//                 <div className="text-center mt-4">

//                   <span className="text-secondary">
//                     Already have an account?{" "}
//                   </span>

//                   <Link
//                     to="/login"
//                     className="fw-semibold text-decoration-none"
//                   >
//                     Sign In
//                   </Link>

//                 </div>

//               </Card.Body>
//             </Card>

//             {/* Footer */}
//             <p className="text-center text-secondary small mt-4">
//               © 2026 MediFlow. All rights reserved.
//             </p>

//           </Col>
//         </Row>
//       </Container>

//     </div>
//   );
// };

// export default Signup;



import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/slices/authSlice";
import { useNotify } from "./NotificationProvider";
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notify } = useNotify();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [validated, setValidated] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;

    setValidated(true);

    if (!form.checkValidity()) {
      e.stopPropagation();
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      notify("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await authApi.registerApi({
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
      });

      if (response?.token && response?.user) {
        dispatch(
          setCredentials({
            user: response.user,
            token: response.token,
          })
        );

        navigate("/");
        return;
      }

      notify(
        response?.message ||
          "Registration successful. Please wait for approval."
      );

      navigate("/login");
    } catch (err) {
      console.error("Signup failed", err);

      notify(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center py-5"
      style={{
        background:
          "linear-gradient(135deg, #f5f7ff 0%, #eef3ff 50%, #f8f9fa 100%)",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={11} md={9} lg={7} xl={6}>
            <div className="text-center mb-4">
              <div
                className="mx-auto mb-3 rounded-4 d-flex align-items-center justify-content-center text-white shadow"
                style={{
                  width: "68px",
                  height: "68px",
                  fontSize: "30px",
                  fontWeight: "800",
                  background:
                    "linear-gradient(135deg, #0d6efd, #6610f2)",
                }}
              >
                M
              </div>

              <h2 className="fw-bold mb-2">
                Create Your MediFlow Account
              </h2>

              <p className="text-muted mb-0">
                Start managing your business and team with MediFlow
              </p>
            </div>

            <Card
              className="border-0 shadow-lg rounded-4"
              style={{
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "5px",
                  background:
                    "linear-gradient(90deg, #0d6efd, #6610f2, #6f42c1)",
                }}
              />

              <Card.Body className="p-4 p-md-5">
                <div className="mb-4">
                  <h4 className="fw-bold mb-1">
                    Company Registration
                  </h4>

                  <p className="text-muted mb-0">
                    Enter your company and account information below.
                  </p>
                </div>

                <Form
                  noValidate
                  validated={validated}
                  onSubmit={handleSubmit}
                >
                  <div className="bg-light rounded-4 p-3 p-md-4 mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "42px",
                          height: "42px",
                        }}
                      >
                        <i className="bi bi-building fs-5"></i>
                      </div>

                      <div>
                        <h6 className="fw-bold mb-0">
                          Company Information
                        </h6>

                        <small className="text-muted">
                          Tell us about your organization
                        </small>
                      </div>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Company Name
                      </Form.Label>

                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white">
                          <i className="bi bi-building text-primary"></i>
                        </InputGroup.Text>

                        <Form.Control
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter company name"
                          required
                        />

                        <Form.Control.Feedback type="invalid">
                          Please enter your company name.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Owner Name
                      </Form.Label>

                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white">
                          <i className="bi bi-person text-primary"></i>
                        </InputGroup.Text>

                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter owner name"
                          required
                        />

                        <Form.Control.Feedback type="invalid">
                          Please enter owner name.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </div>

                  <div className="bg-light rounded-4 p-3 p-md-4 mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "42px",
                          height: "42px",
                        }}
                      >
                        <i className="bi bi-person-vcard fs-5"></i>
                      </div>

                      <div>
                        <h6 className="fw-bold mb-0">
                          Contact Information
                        </h6>

                        <small className="text-muted">
                          Your account contact details
                        </small>
                      </div>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Business Email
                      </Form.Label>

                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white">
                          <i className="bi bi-envelope text-success"></i>
                        </InputGroup.Text>

                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter business email"
                          required
                        />

                        <Form.Control.Feedback type="invalid">
                          Please enter a valid email address.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Mobile Number
                      </Form.Label>

                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white">
                          <i className="bi bi-phone text-success"></i>
                        </InputGroup.Text>

                        <Form.Control
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="Enter mobile number"
                          pattern="[0-9]{10}"
                          required
                        />

                        <Form.Control.Feedback type="invalid">
                          Please enter a valid 10-digit mobile number.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </div>

                  <div className="bg-light rounded-4 p-3 p-md-4 mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className="bg-warning bg-opacity-10 text-warning rounded-3 d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "42px",
                          height: "42px",
                        }}
                      >
                        <i className="bi bi-shield-lock fs-5"></i>
                      </div>

                      <div>
                        <h6 className="fw-bold mb-0">
                          Account Security
                        </h6>

                        <small className="text-muted">
                          Create a secure password
                        </small>
                      </div>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Password
                      </Form.Label>

                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white">
                          <i className="bi bi-lock text-warning"></i>
                        </InputGroup.Text>

                        <Form.Control
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create password"
                          minLength={8}
                          required
                        />

                        <Button
                          variant="outline-secondary"
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                        >
                          <i
                            className={
                              showPassword
                                ? "bi bi-eye-slash"
                                : "bi bi-eye"
                            }
                          ></i>
                        </Button>

                        <Form.Control.Feedback type="invalid">
                          Password must contain at least 8
                          characters.
                        </Form.Control.Feedback>
                      </InputGroup>

                      <Form.Text className="text-muted">
                        Use at least 8 characters for better security.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Confirm Password
                      </Form.Label>

                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white">
                          <i className="bi bi-lock-fill text-warning"></i>
                        </InputGroup.Text>

                        <Form.Control
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                          required
                          isInvalid={
                            formData.confirmPassword.length > 0 &&
                            formData.password !==
                              formData.confirmPassword
                          }
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
                          <i
                            className={
                              showConfirmPassword
                                ? "bi bi-eye-slash"
                                : "bi bi-eye"
                            }
                          ></i>
                        </Button>

                        <Form.Control.Feedback type="invalid">
                          Passwords do not match.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </div>

                  <div
                    className="border rounded-4 p-3 mb-4"
                    style={{
                      background: "#f8f9ff",
                    }}
                  >
                    <Form.Check
                      type="checkbox"
                      required
                      id="terms"
                      label={
                        <span className="text-muted">
                          I agree to the{" "}
                          <Link
                            to="/terms-and-conditions"
                            className="fw-semibold text-primary text-decoration-none"
                          >
                            Terms & Conditions
                          </Link>{" "}
                          and{" "}
                          <Link
                            to="/privacy-policy"
                            className="fw-semibold text-primary text-decoration-none"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 fw-semibold rounded-3 py-3"
                    disabled={loading}
                    style={{
                      background:
                        "linear-gradient(135deg, #0d6efd, #6610f2)",
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Create Account
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <span className="text-muted">
                    Already have an account?{" "}
                  </span>

                  <Link
                    to="/login"
                    className="fw-bold text-primary text-decoration-none"
                  >
                    Sign In
                  </Link>
                </div>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <div className="d-flex justify-content-center gap-3 mb-2">
                <Link
                  to="/privacy-policy"
                  className="text-muted small text-decoration-none"
                >
                  Privacy Policy
                </Link>

                <span className="text-muted">•</span>

                <Link
                  to="/terms-and-conditions"
                  className="text-muted small text-decoration-none"
                >
                  Terms & Conditions
                </Link>

                <span className="text-muted">•</span>

                <Link
                  to="/contact"
                  className="text-muted small text-decoration-none"
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
    </div>
  );
};

export default Signup;