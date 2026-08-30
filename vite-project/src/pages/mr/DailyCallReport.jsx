import { useCallback, useEffect, useState } from "react";
import dcrApi from "../../api/dcrApi";
import { PageContainer, PageHeader, StatCard, Badge } from "../../components/ui";

const todayInput = () => new Date().toISOString().slice(0, 10);
const fmtTime = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const errText = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const LOCKED = ["SUBMITTED", "APPROVED"];

export default function DailyCallReport() {
  const [date, setDate] = useState(todayInput());
  const [report, setReport] = useState(null);
  const [activity, setActivity] = useState(null);
  const [form, setForm] = useState({ summary: "", workWith: "", nextDayPlan: "" });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const [day, list] = await Promise.all([dcrApi.getDay({ date }), dcrApi.listReports({ mine: "true" })]);
      setReport(day.report || null);
      setActivity(day.activity || null);
      setForm({
        summary: day.report?.summary || "",
        workWith: day.report?.workWith || "",
        nextDayPlan: day.report?.nextDayPlan || "",
      });
      setRecent(list.reports || []);
    } catch (err) {
      setError(errText(err, "Unable to load the daily call report"));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const locked = LOCKED.includes(report?.status);

  const save = async () => {
    if (!report?._id) return;
    try {
      setBusy(true);
      setError("");
      const response = await dcrApi.updateReport(report._id, form);
      setReport(response.report);
      setMessage("Saved");
    } catch (err) {
      setError(errText(err, "Unable to save"));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!report?._id) return;
    try {
      setBusy(true);
      setError("");
      await dcrApi.updateReport(report._id, form);
      const response = await dcrApi.submitReport(report._id);
      setReport(response.report);
      setMessage("Report submitted for review");
      const list = await dcrApi.listReports({ mine: "true" });
      setRecent(list.reports || []);
    } catch (err) {
      setError(errText(err, "Unable to submit"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Field"
        title="Daily Call Report"
        description="Your day compiled from logged visits, plus a summary for your manager."
        actions={
          <input type="date" className="form-control" style={{ maxWidth: 180 }} max={todayInput()} value={date} onChange={(event) => setDate(event.target.value)} />
        }
      />

      {error && <div className="alert alert-danger border-0 shadow-sm rounded-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}
      {message && <div className="alert alert-success border-0 shadow-sm rounded-4"><i className="bi bi-check-circle-fill me-2"></i>{message}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : (
        <>
          <div className="row g-3">
            <div className="col-6 col-lg-3"><StatCard label="Doctor calls" value={activity?.doctorCalls ?? 0} icon="bi-heart-pulse" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Chemist calls" value={activity?.chemistCalls ?? 0} icon="bi-shop" iconBg="var(--mf-color-info-subtle)" iconColor="var(--mf-color-info)" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Planned" value={activity?.plannedCalls ?? 0} icon="bi-signpost-split" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Sales booked" value={money(activity?.salesAmount)} icon="bi-cash-stack" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
          </div>

          {report?.status && (
            <div className="mt-3"><Badge status={report.status} />{report.reviewNote && <span className="text-muted small ms-2">Manager note: {report.reviewNote}</span>}</div>
          )}

          <div className="card border-0 shadow-sm rounded-4 mt-3">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-0">Calls on {fmtDate(date)}</h5>
            </div>
            {activity?.calls?.length ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="border-bottom">
                      <th className="py-3 px-4 text-muted small text-uppercase">Time</th>
                      <th className="py-3 text-muted small text-uppercase">Name</th>
                      <th className="py-3 text-muted small text-uppercase">Type</th>
                      <th className="py-3 text-muted small text-uppercase">Response</th>
                      <th className="py-3 text-muted small text-uppercase">Discussion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.calls.map((call) => (
                      <tr key={call._id}>
                        <td className="py-3 px-4">{fmtTime(call.visitedAt)}</td>
                        <td className="py-3 fw-semibold">{call.name}{call.specialty ? <span className="text-muted small"> · {call.specialty}</span> : ""}</td>
                        <td className="py-3 text-capitalize">{call.kind.toLowerCase()}</td>
                        <td className="py-3">{call.doctorResponse ? <span className="badge text-bg-light">{call.doctorResponse.replace(/_/g, " ").toLowerCase()}</span> : "—"}</td>
                        <td className="py-3"><span className="text-muted small">{call.discussion || "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card-body text-muted">No visits logged for this day.</div>
            )}
          </div>

          <div className="card border-0 shadow-sm rounded-4 mt-3">
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Day summary</label>
                  <textarea className="form-control" rows={3} disabled={locked} value={form.summary}
                    onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Key outcomes, issues, follow-ups" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Worked with</label>
                  <input className="form-control" disabled={locked} value={form.workWith}
                    onChange={(event) => setForm((current) => ({ ...current, workWith: event.target.value }))}
                    placeholder="Manager / colleague accompanying you" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Plan for tomorrow</label>
                  <input className="form-control" disabled={locked} value={form.nextDayPlan}
                    onChange={(event) => setForm((current) => ({ ...current, nextDayPlan: event.target.value }))} />
                </div>
              </div>
              {!locked && (
                <div className="d-flex gap-2 mt-3">
                  <button type="button" className="btn btn-outline-secondary rounded-3" disabled={busy || !report?._id} onClick={save}>Save draft</button>
                  <button type="button" className="btn btn-primary rounded-3" disabled={busy || !report?._id} onClick={submit}>Submit report</button>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 mt-3">
            <div className="card-header bg-white border-0 p-4"><h5 className="fw-bold mb-0">Recent reports</h5></div>
            {recent.length ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="border-bottom">
                      <th className="py-3 px-4 text-muted small text-uppercase">Date</th>
                      <th className="py-3 text-muted small text-uppercase">Status</th>
                      <th className="py-3 text-muted small text-uppercase">Reviewed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((item) => (
                      <tr key={item._id} role="button" style={{ cursor: "pointer" }} onClick={() => setDate(new Date(item.date).toISOString().slice(0, 10))}>
                        <td className="py-3 px-4">{fmtDate(item.date)}</td>
                        <td className="py-3"><Badge status={item.status} /></td>
                        <td className="py-3">{item.reviewedBy?.name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card-body text-muted">No reports yet.</div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
