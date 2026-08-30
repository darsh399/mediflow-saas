import { useEffect, useState } from "react";
import activityApi from "../api/activityApi";
import visitApi from "../api/visitApi";
import dcrApi from "../api/dcrApi";
import DcrDetailModal from "./DcrDetailModal";
import { Badge } from "./ui";

const TABS = [["work", "Work Log"], ["visits", "Visits"], ["dcr", "Daily Call Reports"]];
const RANGES = [["today", "Today"], ["month", "This month"], ["all", "All time"]];

const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const fmtTime = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");

const inRange = (value, range) => {
  if (range === "all") return true;
  const date = new Date(value);
  const now = new Date();
  if (range === "today") return date.toDateString() === now.toDateString();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

// Field & work activity for one employee — visible to reviewers on the profile
// page. Each tab loads once; the range filter is applied client-side.
export default function EmployeeActivityPanel({ employeeId }) {
  const [tab, setTab] = useState("work");
  const [range, setRange] = useState("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState(null);
  const [visits, setVisits] = useState(null);
  const [reports, setReports] = useState(null);
  const [dcrOpen, setDcrOpen] = useState(null);

  useEffect(() => {
    setActivities(null);
    setVisits(null);
    setReports(null);
  }, [employeeId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if ((tab === "work" && activities) || (tab === "visits" && visits) || (tab === "dcr" && reports)) return;
      setLoading(true);
      setError("");
      try {
        if (tab === "work") {
          const response = await activityApi.listActivities({ employeeId });
          if (!cancelled) setActivities(response.activities || []);
        } else if (tab === "visits") {
          const response = await visitApi.listEmployeeVisits(employeeId, { range: "LAST_3_MONTHS", limit: 100 });
          if (!cancelled) setVisits(response.visits || []);
        } else {
          const response = await dcrApi.listReports({ employeeId });
          if (!cancelled) setReports(response.reports || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Unable to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tab, employeeId, activities, visits, reports]);

  const shownActivities = (activities || []).filter((item) => inRange(item.date, range));
  const shownVisits = (visits || []).filter((item) => inRange(item.visitedAt, range));
  const shownReports = (reports || []).filter((item) => inRange(item.date, range));

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0 pt-4 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 className="fw-bold mb-1">Field &amp; Work Activity</h5>
          <p className="text-muted small mb-0">What this employee has logged</p>
        </div>
        <select className="form-select form-select-sm w-auto" value={range} onChange={(event) => setRange(event.target.value)}>
          {RANGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="card-body px-4">
        <ul className="nav nav-pills gap-2 mb-3">
          {TABS.map(([value, label]) => (
            <li className="nav-item" key={value}>
              <button type="button" className={`nav-link ${tab === value ? "active" : ""}`} onClick={() => setTab(value)}>{label}</button>
            </li>
          ))}
        </ul>

        {error && <div className="alert alert-danger border-0 py-2 small">{error}</div>}

        {loading ? (
          <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
        ) : tab === "work" ? (
          shownActivities.length ? (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead><tr className="small text-muted text-uppercase"><th>Date</th><th>Description</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {shownActivities.map((item) => (
                    <tr key={item._id}>
                      <td>{fmtDate(item.date)}</td>
                      <td>{item.description}{item.projectId?.title ? <span className="text-muted small"> · {item.projectId.title}</span> : ""}</td>
                      <td>{item.hoursWorked}</td>
                      <td><Badge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-muted small mb-0">No work log entries for this period.</p>
        ) : tab === "visits" ? (
          shownVisits.length ? (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead><tr className="small text-muted text-uppercase"><th>Date</th><th>Visited</th><th>Type</th><th>Response</th><th>Status</th></tr></thead>
                <tbody>
                  {shownVisits.map((visit) => (
                    <tr key={visit._id}>
                      <td>{fmtDate(visit.visitedAt)} <span className="text-muted small">{fmtTime(visit.visitedAt)}</span></td>
                      <td className="fw-semibold">{visit.doctorId?.name || visit.medicalId?.name || "—"}</td>
                      <td>{visit.doctorId ? "Doctor" : "Chemist"}</td>
                      <td>{visit.doctorResponse ? visit.doctorResponse.replace(/_/g, " ").toLowerCase() : "—"}</td>
                      <td><Badge status={visit.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-muted small mb-0">No visits for this period.</p>
        ) : (
          shownReports.length ? (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead><tr className="small text-muted text-uppercase"><th>Date</th><th>Summary</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {shownReports.map((report) => (
                    <tr key={report._id}>
                      <td>{fmtDate(report.date)}</td>
                      <td><span className="text-muted small">{report.summary || "—"}</span></td>
                      <td><Badge status={report.status} /></td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setDcrOpen(report)}>
                          <i className="bi bi-eye me-1"></i>View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-muted small mb-0">No daily call reports for this period.</p>
        )}
      </div>

      {dcrOpen && <DcrDetailModal report={dcrOpen} onClose={() => setDcrOpen(null)} />}
    </div>
  );
}
