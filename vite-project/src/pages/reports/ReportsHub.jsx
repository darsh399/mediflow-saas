import { Link } from "react-router-dom";
import { PageContainer, PageHeader } from "../../components/ui";

const REPORTS = [
  { type: "attendance", label: "Attendance", icon: "bi-clock-history", desc: "Present / late / absent days and hours per employee." },
  { type: "leave", label: "Leave", icon: "bi-calendar2-week", desc: "Leave requests, days and status for the period." },
  { type: "expense", label: "Expense", icon: "bi-receipt", desc: "Expense claims, categories and approved value." },
  { type: "visits", label: "Field Visits", icon: "bi-geo-alt", desc: "Doctor and chemist visits with responses.", to: "/reports/visits" },
  { type: "sales", label: "Sales", icon: "bi-graph-up-arrow", desc: "Recorded sales by rep, doctor and product." },
];

const ReportsHub = () => (
  <PageContainer>
    <PageHeader
      eyebrow="Insights"
      title="Reports"
      description="Filter by month and employee, view on screen, and export to CSV."
    />

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
  </PageContainer>
);

export default ReportsHub;
