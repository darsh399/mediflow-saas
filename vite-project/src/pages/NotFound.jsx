import { Link } from "react-router-dom";

const NotFound = () => (
  <main className="container py-5 text-center">
    <div className="py-5">
      <p className="display-1 fw-bold text-primary mb-0">404</p>
      <h1 className="h2 mt-3">Page not found</h1>
      <p className="text-muted mb-4">The page you requested does not exist or may have moved.</p>
      <Link className="btn btn-primary" to="/">Go to home</Link>
    </div>
  </main>
);

export default NotFound;
