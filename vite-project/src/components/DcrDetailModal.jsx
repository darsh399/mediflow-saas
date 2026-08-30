import { useEffect, useState } from "react";
import dcrApi from "../api/dcrApi";
import { AppModal, Badge } from "./ui";

const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const fmtTime = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Read-only detail of one daily call report: the day compiled from visits/sales
// plus the rep's narrative. `report` needs at least { date, employeeId }.
export default function DcrDetailModal({ report, title, footer, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    dcrApi
      .getDay({ date: report.date, employeeId: report.employeeId?._id || report.employeeId })
      .then((response) => { if (!cancelled) setData(response); })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.message || "Unable to load this report"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [report]);

  const activity = data?.activity;
  const full = data?.report || report;
  const repName = report.employeeId?.name || full.employeeId?.name || "Rep";

  return (
    <AppModal
      title={title || `Daily call report — ${repName}`}
      subtitle={fmtDate(report.date)}
      size="lg"
      onClose={onClose}
      footer={footer}
    >
      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
      ) : error ? (
        <div className="alert alert-danger border-0 mb-0">{error}</div>
      ) : (
        <>
          {full.status && (
            <div className="mb-3">
              <Badge status={full.status} />
              {full.reviewNote && <span className="text-muted small ms-2">Note: {full.reviewNote}</span>}
            </div>
          )}

          <div className="row g-2 mb-3">
            {[
              ["Doctors", activity?.doctorCalls ?? 0],
              ["Chemists", activity?.chemistCalls ?? 0],
              ["Planned", activity?.plannedCalls ?? 0],
              ["Sales", money(activity?.salesAmount)],
            ].map(([label, value]) => (
              <div className="col-3" key={label}>
                <div className="border rounded-3 p-2 text-center">
                  <div className="fw-bold">{value}</div>
                  <div className="small text-muted">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <h6 className="fw-bold">Calls</h6>
          {activity?.calls?.length ? (
            <div className="table-responsive mb-3">
              <table className="table table-sm align-middle">
                <thead>
                  <tr className="small text-muted text-uppercase">
                    <th>Time</th><th>Name</th><th>Type</th><th>Response</th><th>Discussion</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.calls.map((call) => (
                    <tr key={call._id}>
                      <td>{fmtTime(call.visitedAt)}</td>
                      <td className="fw-semibold">{call.name}{call.specialty ? <span className="text-muted small"> · {call.specialty}</span> : ""}</td>
                      <td className="text-capitalize">{call.kind.toLowerCase()}</td>
                      <td>{call.doctorResponse ? call.doctorResponse.replace(/_/g, " ").toLowerCase() : "—"}</td>
                      <td><span className="text-muted small">{call.discussion || "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted small">No visits logged for this day.</p>
          )}

          <dl className="row small mb-0">
            <dt className="col-sm-3 text-muted fw-normal">Day summary</dt>
            <dd className="col-sm-9">{full.summary || "—"}</dd>
            <dt className="col-sm-3 text-muted fw-normal">Worked with</dt>
            <dd className="col-sm-9">{full.workWith || "—"}</dd>
            <dt className="col-sm-3 text-muted fw-normal">Plan for tomorrow</dt>
            <dd className="col-sm-9">{full.nextDayPlan || "—"}</dd>
          </dl>
        </>
      )}
    </AppModal>
  );
}
