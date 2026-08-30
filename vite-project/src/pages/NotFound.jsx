import { Link } from "react-router-dom";

const NotFound = () => (
  <main className="min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ background: "var(--mf-bg)" }}>
    <div className="container px-3 text-center">
      <div className="card border-0 shadow-lg rounded-4 mx-auto overflow-hidden" style={{ maxWidth: "480px" }}>
        <div className="card-body p-4 p-md-5">
          <div
            className="mx-auto mb-3 rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
            style={{ width: "70px", height: "70px", fontSize: "28px" }}
          >
            <i className="bi bi-signpost-2-fill"></i>
          </div>
          <p className="display-4 fw-bold text-primary mb-0">404</p>
          <h1 className="h4 mt-2">Page not found</h1>
          <p className="text-muted mb-4">The page you requested does not exist or may have moved.</p>
          <Link className="btn btn-primary rounded-3 px-4" to="/">
            <i className="bi bi-house-door me-2"></i>
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  </main>
);

export default NotFound;
