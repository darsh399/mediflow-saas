import { Link } from "react-router-dom";

const REPORTS = [
  { type: "attendance", label: "Attendance", icon: "bi-clock-history", desc: "Present / late / absent days and hours per employee." },
  { type: "leave", label: "Leave", icon: "bi-calendar2-week", desc: "Leave requests, days and status for the period." },
  { type: "expense", label: "Expense", icon: "bi-receipt", desc: "Expense claims, categories and approved value." },
  { type: "visits", label: "Field Visits", icon: "bi-geo-alt", desc: "Doctor and chemist visits with responses.", to: "/reports/visits" },
  { type: "sales", label: "Sales", icon: "bi-graph-up-arrow", desc: "Recorded sales by rep, doctor and product." },
];

const ReportsHub = () => (
  <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
    <div className="container-fluid px-0">

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div
          className="card-body p-4 p-lg-5 text-white"
          style={{ background: "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)" }}
        >
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
              <i className="bi bi-bar-chart-line fs-3"></i>
            </div>
            <div>
              <span className="small opacity-75">INSIGHTS</span>
              <h2 className="fw-bold mb-0">Reports</h2>
            </div>
          </div>
          <p className="mb-0 opacity-75">Filter by month and employee, view on screen, and export to CSV.</p>
        </div>
      </div>

      <div className="row g-3">
        {REPORTS.map((report) => (
          <div className="col-md-6 col-xl-4" key={report.type}>
            <Link to={report.to || `/reports/${report.type}`} className="card border-0 shadow-sm rounded-4 h-100 text-decoration-none">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: "44px", height: "44px", background: "var(--mf-color-primary-subtle)", color: "var(--mf-color-primary)" }}
                  >
                    <i className={`bi ${report.icon} fs-5`}></i>
                  </div>
                  <h5 className="fw-bold mb-0 text-dark">{report.label}</h5>
                </div>
                <p className="text-muted small mb-0">{report.desc}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ReportsHub;
