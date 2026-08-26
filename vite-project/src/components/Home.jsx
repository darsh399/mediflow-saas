import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Badge,
} from "react-bootstrap";

const Home = () => {
  return (
    <div>

      {/* ================= HERO SECTION ================= */}

      <section className="bg-light py-5">
        <Container>
          <Row className="align-items-center py-5">

            {/* Left Content */}

            <Col lg={6} className="mb-5 mb-lg-0">

              <Badge
                bg="primary"
                className="px-3 py-2 mb-3"
              >
                Smart Business Management SaaS
              </Badge>

              <h1 className="display-4 fw-bold text-dark mb-4">
                Manage Your Entire
                <span className="text-primary">
                  {" "}Business
                </span>
                {" "}In One Place
              </h1>

              <p className="lead text-secondary mb-4">
                Manage employees, HR, doctors, medicals, field
                representatives, visits and reports from one
                powerful platform.
              </p>

              <div className="d-flex flex-wrap gap-3">

                <Link to="/login">
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-4"
                  >
                    Sign In
                  </Button>
                </Link>

              </div>

              <p className="text-secondary small mt-3">
                No complicated setup • Secure • Cloud based
              </p>

            </Col>

            {/* Right Dashboard Preview */}

            <Col lg={6}>

              <Card className="border-0 shadow-lg rounded-4 overflow-hidden">

                <Card.Header className="bg-white border-0 py-3">

                  <div className="d-flex align-items-center justify-content-between">

                    <div className="d-flex gap-2">

                      <span
                        className="rounded-circle bg-danger"
                        style={{
                          width: "10px",
                          height: "10px",
                        }}
                      />

                      <span
                        className="rounded-circle bg-warning"
                        style={{
                          width: "10px",
                          height: "10px",
                        }}
                      />

                      <span
                        className="rounded-circle bg-success"
                        style={{
                          width: "10px",
                          height: "10px",
                        }}
                      />

                    </div>

                    <small className="text-secondary">
                      Dashboard
                    </small>

                  </div>

                </Card.Header>

                <Card.Body className="p-4">

                  <h5 className="fw-bold mb-4">
                    Business Overview
                  </h5>

                  <Row className="g-3">

                    <Col xs={6}>
                      <Card className="border-0 bg-primary bg-opacity-10">
                        <Card.Body>
                          <small className="text-secondary">
                            Employees
                          </small>

                          <h3 className="fw-bold text-primary mb-0">
                            248
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xs={6}>
                      <Card className="border-0 bg-success bg-opacity-10">
                        <Card.Body>
                          <small className="text-secondary">
                            Doctors
                          </small>

                          <h3 className="fw-bold text-success mb-0">
                            126
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xs={6}>
                      <Card className="border-0 bg-warning bg-opacity-10">
                        <Card.Body>
                          <small className="text-secondary">
                            Visits
                          </small>

                          <h3 className="fw-bold text-warning mb-0">
                            1,284
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xs={6}>
                      <Card className="border-0 bg-info bg-opacity-10">
                        <Card.Body>
                          <small className="text-secondary">
                            Reports
                          </small>

                          <h3 className="fw-bold text-info mb-0">
                            96
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>

                  </Row>

                </Card.Body>

              </Card>

            </Col>

          </Row>
        </Container>
      </section>


      {/* ================= FEATURES ================= */}

      <section className="py-5">
        <Container>

          <div className="text-center mb-5">

            <Badge
              bg="primary"
              className="px-3 py-2 mb-3"
            >
              Powerful Features
            </Badge>

            <h2 className="fw-bold">
              Everything Your Business Needs
            </h2>

            <p className="text-secondary">
              Manage your entire organization from one
              centralized platform.
            </p>

          </div>

          <Row className="g-4">

            {/* Employees */}

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">

                  <div
                    className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "22px",
                    }}
                  >
                    👥
                  </div>

                  <h5 className="fw-bold">
                    Employee Management
                  </h5>

                  <p className="text-secondary mb-0">
                    Manage employees, profiles, roles,
                    departments and reporting structures
                    efficiently.
                  </p>

                </Card.Body>
              </Card>
            </Col>


            {/* HR */}

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">

                  <div
                    className="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "22px",
                    }}
                  >
                    📋
                  </div>

                  <h5 className="fw-bold">
                    HR Management
                  </h5>

                  <p className="text-secondary mb-0">
                    Manage employee information, leave
                    requests, documents and HR operations.
                  </p>

                </Card.Body>
              </Card>
            </Col>


            {/* Doctors */}

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">

                  <div
                    className="bg-danger bg-opacity-10 text-danger rounded-3 d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "22px",
                    }}
                  >
                    🩺
                  </div>

                  <h5 className="fw-bold">
                    Doctor Management
                  </h5>

                  <p className="text-secondary mb-0">
                    Maintain doctor and medical records
                    with accurate location information.
                  </p>

                </Card.Body>
              </Card>
            </Col>


            {/* Visit Tracking */}

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">

                  <div
                    className="bg-warning bg-opacity-10 text-warning rounded-3 d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "22px",
                    }}
                  >
                    📍
                  </div>

                  <h5 className="fw-bold">
                    Visit Tracking
                  </h5>

                  <p className="text-secondary mb-0">
                    Verify field visits using GPS location
                    and ensure visits happen at registered
                    locations.
                  </p>

                </Card.Body>
              </Card>
            </Col>


            {/* Reports */}

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">

                  <div
                    className="bg-info bg-opacity-10 text-info rounded-3 d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "22px",
                    }}
                  >
                    📊
                  </div>

                  <h5 className="fw-bold">
                    Reports & Analytics
                  </h5>

                  <p className="text-secondary mb-0">
                    Get clear insights into employees,
                    visits, activities and business
                    performance.
                  </p>

                </Card.Body>
              </Card>
            </Col>


            {/* Security */}

            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">

                  <div
                    className="bg-dark bg-opacity-10 text-dark rounded-3 d-flex align-items-center justify-content-center mb-4"
                    style={{
                      width: "50px",
                      height: "50px",
                      fontSize: "22px",
                    }}
                  >
                    🔐
                  </div>

                  <h5 className="fw-bold">
                    Secure & Role Based
                  </h5>

                  <p className="text-secondary mb-0">
                    Keep company data secure with
                    authentication and role-based access
                    control.
                  </p>

                </Card.Body>
              </Card>
            </Col>

          </Row>

        </Container>
      </section>


      {/* ================= CTA ================= */}

      <section className="bg-primary py-5">
        <Container>

          <Row className="align-items-center">

            <Col md={8} className="text-white mb-3 mb-md-0">

              <h2 className="fw-bold">
                Ready to simplify your business?
              </h2>

              <p className="mb-0 opacity-75">
                Start managing your organization with
                MediFlow today.
              </p>

            </Col>

            <Col
              md={4}
              className="text-md-end"
            >

              <Link to="/login">
                <Button
                  variant="light"
                  size="lg"
                  className="px-4 fw-semibold text-primary"
                >
                  Sign In
                </Button>
              </Link>

            </Col>

          </Row>

        </Container>
      </section>


      {/* ================= FOOTER ================= */}

      <footer className="bg-dark text-white py-4">

        <Container>

          <Row className="align-items-center">

            <Col md={6}>
              <h5 className="fw-bold mb-1">
                MediFlow
              </h5>

              <small className="text-white-50">
                Smart business management platform
              </small>
            </Col>

            <Col
              md={6}
              className="text-md-end mt-3 mt-md-0"
            >
              <small className="text-white-50">
                © 2026 MediFlow. All rights reserved.
              </small>
            </Col>

          </Row>

        </Container>

      </footer>

    </div>
  );
};

export default Home;