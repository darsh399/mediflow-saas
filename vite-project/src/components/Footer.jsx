import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-dark text-white">

      {/* Main Footer */}
      <div className="container py-5">

        <div className="row g-4">

          {/* Brand */}
          <div className="col-lg-4 col-md-6">

            <Link
              to="/"
              className="text-decoration-none text-white d-flex align-items-center gap-2 mb-3"
            >
              <div
                className="bg-primary rounded-3 d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: "42px",
                  height: "42px",
                  fontSize: "18px",
                }}
              >
                M
              </div>

              <span className="fs-5 fw-bold">
                MediFlow
              </span>
            </Link>

            <p className="text-white-50 pe-lg-5">
              A powerful business management platform designed
              to help companies manage employees, HR, doctors,
              field representatives, visits and reports from
              one place.
            </p>

            <div className="d-flex gap-2 mt-4">

              <a
                href="#"
                className="btn btn-outline-light btn-sm rounded-circle"
                aria-label="Facebook"
              >
                f
              </a>

              <a
                href="#"
                className="btn btn-outline-light btn-sm rounded-circle"
                aria-label="LinkedIn"
              >
                in
              </a>

              <a
                href="#"
                className="btn btn-outline-light btn-sm rounded-circle"
                aria-label="Twitter"
              >
                X
              </a>

            </div>

          </div>

          {/* Product */}
          <div className="col-6 col-lg-2 col-md-3">

            <h6 className="fw-bold mb-3">
              Product
            </h6>

            <ul className="list-unstyled">

              <li className="mb-2">
                <Link
                  to="/features"
                  className="text-white-50 text-decoration-none"
                >
                  Features
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/pricing"
                  className="text-white-50 text-decoration-none"
                >
                  Pricing
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-white-50 text-decoration-none"
                >
                  About
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/login"
                  className="text-white-50 text-decoration-none"
                >
                  Login
                </Link>
              </li>

            </ul>

          </div>

          {/* Solutions */}
          <div className="col-6 col-lg-2 col-md-3">

            <h6 className="fw-bold mb-3">
              Solutions
            </h6>

            <ul className="list-unstyled">

              <li className="mb-2">
                <span className="text-white-50">
                  Employee Management
                </span>
              </li>

              <li className="mb-2">
                <span className="text-white-50">
                  HR Management
                </span>
              </li>

              <li className="mb-2">
                <span className="text-white-50">
                  Visit Tracking
                </span>
              </li>

              <li className="mb-2">
                <span className="text-white-50">
                  Reports
                </span>
              </li>

            </ul>

          </div>

          {/* Company */}
          <div className="col-6 col-lg-2 col-md-6">

            <h6 className="fw-bold mb-3">
              Company
            </h6>

            <ul className="list-unstyled">

              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-white-50 text-decoration-none"
                >
                  About Us
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/contact"
                  className="text-white-50 text-decoration-none"
                >
                  Contact
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/privacy"
                  className="text-white-50 text-decoration-none"
                >
                  Privacy Policy
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/terms"
                  className="text-white-50 text-decoration-none"
                >
                  Terms & Conditions
                </Link>
              </li>

            </ul>

          </div>

          {/* Contact */}
          <div className="col-6 col-lg-2 col-md-6">

            <h6 className="fw-bold mb-3">
              Contact
            </h6>

            <ul className="list-unstyled text-white-50">

              <li className="mb-3">
                <span className="me-2">✉</span>
                support@mediflow.com
              </li>

              <li className="mb-3">
                <span className="me-2">☎</span>
                +91 98765 43210
              </li>

              <li>
                <span className="me-2">📍</span>
                Pune, Maharashtra, India
              </li>

            </ul>

          </div>

        </div>

      </div>

      {/* Bottom Footer */}
      <div className="border-top border-secondary">

        <div className="container py-3">

          <div className="row align-items-center">

            <div className="col-md-6 text-center text-md-start">

              <small className="text-white-50">
                © 2026 MediFlow. All rights reserved.
              </small>

            </div>

            <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">

              <small className="text-white-50">
                Built for modern businesses
              </small>

            </div>

          </div>

        </div>

      </div>

    </footer>
  );
};

export default Footer;