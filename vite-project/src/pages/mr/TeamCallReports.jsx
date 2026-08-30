import { useEffect, useMemo, useState } from "react";
import dcrApi from "../../api/dcrApi";
import DcrDetailModal from "../../components/DcrDetailModal";
import { PageContainer, PageHeader, StatCard, Badge } from "../../components/ui";

const STATUSES = [["", "All statuses"], ["SUBMITTED", "Submitted"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"]];
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const monthAgo = () => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

export default function TeamCallReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await dcrApi.listReports({ from, to, status: status || undefined, employeeId: employeeId || undefined });
        if (!cancelled) setReports(response.reports || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Unable to load reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [from, to, status, employeeId]);

  const employeeOptions = useMemo(() => {
    const seen = new Map();
    for (const report of reports) {
      const person = report.employeeId;
      if (person?._id && !seen.has(person._id)) seen.set(person._id, person.name || person.email || "Unknown");
    }
    return [...seen.entries()];
  }, [reports]);

  const approved = reports.filter((report) => report.status === "APPROVED").length;
  const pending = reports.filter((report) => report.status === "SUBMITTED").length;

  return (
    <PageContainer>
      <PageHeader eyebrow="Field" title="Team Call Reports" description="Every daily call report from your team — submitted, approved and rejected." />

      <div className="row g-3">
        <div className="col-6 col-lg-3"><StatCard label="Reports" value={reports.length} icon="bi-journal-text" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Awaiting review" value={pending} icon="bi-hourglass-split" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Approved" value={approved} icon="bi-check2-circle" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mt-3">
        <div className="card-body p-3 d-flex flex-wrap gap-2 align-items-center">
          <select className="form-select form-select-sm" style={{ maxWidth: 170 }} value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {employeeOptions.length > 0 && (
            <select className="form-select form-select-sm" style={{ maxWidth: 190 }} value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              <option value="">All reps</option>
              {employeeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
          <input type="date" className="form-control form-control-sm" style={{ maxWidth: 160 }} max={to} value={from} onChange={(event) => setFrom(event.target.value)} />
          <input type="date" className="form-control form-control-sm" style={{ maxWidth: 160 }} max={today()} value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm rounded-4 mt-3">{error}</div>}

      <div className="card border-0 shadow-sm rounded-4 mt-3">
        {loading ? (
          <div className="card-body text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : reports.length === 0 ? (
          <div className="card-body text-muted">No reports match these filters.</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="border-bottom">
                  <th className="py-3 px-4 text-muted small text-uppercase">Date</th>
                  <th className="py-3 text-muted small text-uppercase">Rep</th>
                  <th className="py-3 text-muted small text-uppercase">Status</th>
                  <th className="py-3 text-muted small text-uppercase">Reviewed by</th>
                  <th className="py-3 text-muted small text-uppercase">Summary</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td className="py-3 px-4">{fmtDate(report.date)}</td>
                    <td className="py-3 fw-semibold">{report.employeeId?.name || "—"}</td>
                    <td className="py-3"><Badge status={report.status} /></td>
                    <td className="py-3">{report.reviewedBy?.name || "—"}</td>
                    <td className="py-3"><span className="text-muted small">{report.summary || "—"}</span></td>
                    <td className="py-3 text-end pe-4">
                      <button type="button" className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setOpen(report)}>
                        <i className="bi bi-eye me-1"></i>View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <DcrDetailModal report={open} onClose={() => setOpen(null)} />}
    </PageContainer>
  );
}
