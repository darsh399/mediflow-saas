import { useEffect, useMemo, useState } from "react";

import targetApi from "../../api/targetApi";
import userApi from "../../api/userApi";
import projectApi from "../../api/projectApi";
import { useNotify } from "../../components/NotificationProvider";
import {
  MANAGER_ROLES,
  money,
  errorMessage,
  monthLabel,
  recentMonths,
  progressColor,
  fmtDate,
} from "./salesShared";

const ProgressCell = ({ pct, exceeded }) => {
  if (pct === null || pct === undefined) return <span className="text-muted small">no target</span>;
  return (
    <div style={{ minWidth: 120 }}>
      <div className="progress" style={{ height: "6px" }}>
        <div className={`progress-bar bg-${progressColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className={`small fw-semibold text-${progressColor(pct)}`}>
        {pct}%{exceeded ? " · exceeded" : ""}
      </span>
    </div>
  );
};

const TargetsTab = ({ role, period, setPeriod }) => {
  const { notify } = useNotify();
  const isManager = MANAGER_ROLES.includes(role);
  const months = useMemo(() => recentMonths(), []);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  const [form, setForm] = useState(null); // { mode, employeeId, month, year, salesTarget, visitTarget, projectId, note, targetId }
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await targetApi.listTargets({
        month: period.month,
        year: period.year,
        ...(employeeFilter ? { employeeId: employeeFilter } : {}),
        ...(projectFilter ? { projectId: projectFilter } : {}),
      });
      setRows(response.rows || []);
      setSummary(response.summary || null);
    } catch (err) {
      setError(errorMessage(err, "Unable to load targets"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, employeeFilter, projectFilter]);

  useEffect(() => {
    if (!isManager) return;
    userApi.listUsers().then((r) => setEmployees((r.users || []).filter((u) => u.active !== false))).catch(() => setEmployees([]));
    projectApi.listProjects().then((r) => setProjects(r.projects || [])).catch(() => setProjects([]));
  }, [isManager]);

  const openCreate = () => {
    setForm({
      mode: "create",
      employeeId: "",
      salesTarget: "",
      visitTarget: "",
      projectId: "",
      note: "",
    });
  };

  const openEdit = (row) => {
    setForm({
      mode: "edit",
      targetId: row.targetId,
      employeeId: row.employeeId,
      name: row.name,
      salesTarget: String(row.salesTarget || ""),
      visitTarget: String(row.visitTarget || ""),
      projectId: row.projectId || "",
      note: row.note || "",
    });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (form.mode === "create") {
        await targetApi.createTarget({
          employeeId: form.employeeId,
          month: period.month,
          year: period.year,
          salesTarget: Number(form.salesTarget) || 0,
          visitTarget: Number(form.visitTarget) || 0,
          projectId: form.projectId || undefined,
          note: form.note.trim() || undefined,
        });
        notify("Target created");
      } else {
        await targetApi.updateTarget(form.targetId, {
          salesTarget: Number(form.salesTarget) || 0,
          visitTarget: Number(form.visitTarget) || 0,
          projectId: form.projectId || "",
          note: form.note.trim(),
        });
        notify("Target updated");
      }
      setForm(null);
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to save target"), "", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeTarget = async (row) => {
    if (!window.confirm(`Remove the ${monthLabel(period.month, period.year)} target for ${row.name}?`)) return;
    try {
      await targetApi.deleteTarget(row.targetId);
      notify("Target removed");
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to remove target"), "", "error");
    }
  };

  const openDetail = async (row) => {
    if (!row.targetId) return;
    setDetail({ row });
    setDetailLoading(true);
    try {
      const response = await targetApi.getTarget(row.targetId);
      setDetail({ row, ...response });
    } catch (err) {
      notify(errorMessage(err, "Unable to load target detail"), "", "error");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3 d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="form-label small fw-semibold mb-1">Month</label>
            <select
              className="form-select form-select-sm"
              value={`${period.year}-${period.month}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-").map(Number);
                setPeriod({ month, year });
              }}
            >
              {months.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{monthLabel(m.month, m.year)}</option>
              ))}
            </select>
          </div>
          {isManager && (
            <>
              <div>
                <label className="form-label small fw-semibold mb-1">Employee</label>
                <select className="form-select form-select-sm" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
                  <option value="">All</option>
                  {employees.map((emp) => <option value={emp._id} key={emp._id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label small fw-semibold mb-1">Project</label>
                <select className="form-select form-select-sm" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                  <option value="">All</option>
                  {projects.map((project) => <option value={project._id} key={project._id}>{project.name}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-sm btn-primary ms-auto" onClick={openCreate}>
                <i className="bi bi-plus-lg me-1"></i>Create Target
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm rounded-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}

      {summary && (
        <div className="row g-3 mb-3">
          <SummaryCard label="Sales target" value={money(summary.salesTarget)} sub={`${money(summary.completedSales)} done · ${money(summary.remainingSales)} left`} pct={summary.salesProgress} />
          <SummaryCard label="Visit target" value={summary.visitTarget} sub={`${summary.completedVisits} done · ${summary.remainingVisits} left`} pct={summary.visitProgress} />
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : rows.length === 0 ? (
          <div className="text-center text-muted py-5">
            No targets or activity for {monthLabel(period.month, period.year)}.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                <tr>
                  <th className="px-4 py-3 border-0">Employee</th>
                  <th className="py-3 border-0">Visit target</th>
                  <th className="py-3 border-0">Done</th>
                  <th className="py-3 border-0">Left</th>
                  <th className="py-3 border-0">Visit %</th>
                  <th className="py-3 border-0">Sales target</th>
                  <th className="py-3 border-0">Done</th>
                  <th className="py-3 border-0">Left</th>
                  <th className="py-3 border-0">Sales %</th>
                  <th className="py-3 border-0 pe-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.employeeId}>
                    <td className="px-4 py-3">
                      <button type="button" className="btn btn-link p-0 fw-semibold text-decoration-none text-dark" onClick={() => openDetail(row)} disabled={!row.targetId}>
                        {row.name}
                      </button>
                      <div className="small text-muted text-capitalize">{String(row.role || "").replace(/_/g, " ")}</div>
                    </td>
                    <td className="py-3">{row.visitTarget || "—"}</td>
                    <td className="py-3 fw-semibold">{row.completedVisits}{row.extraVisits > 0 && <span className="text-success small"> (+{row.extraVisits})</span>}</td>
                    <td className="py-3">{row.visitTarget ? row.remainingVisits : "—"}</td>
                    <td className="py-3"><ProgressCell pct={row.visitProgress} exceeded={row.visitsExceeded} /></td>
                    <td className="py-3">{row.salesTarget ? money(row.salesTarget) : "—"}</td>
                    <td className="py-3 fw-semibold">{money(row.completedSales)}{row.extraSales > 0 && <span className="text-success small"> (+{money(row.extraSales)})</span>}</td>
                    <td className="py-3">{row.salesTarget ? money(row.remainingSales) : "—"}</td>
                    <td className="py-3"><ProgressCell pct={row.salesProgress} exceeded={row.salesExceeded} /></td>
                    <td className="py-3 pe-4 text-end">
                      {isManager && (
                        <div className="d-flex gap-1 justify-content-end">
                          <button type="button" className="btn btn-sm btn-light border" onClick={() => openEdit(row)} aria-label="Edit target"><i className="bi bi-pencil"></i></button>
                          {row.targetId && (
                            <button type="button" className="btn btn-sm btn-light border text-danger" onClick={() => removeTarget(row)} aria-label="Remove target"><i className="bi bi-trash"></i></button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,.45)" }} onClick={() => setForm(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4">
              <form onSubmit={submitForm}>
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">
                    {form.mode === "create" ? "Create target" : `Edit target — ${form.name}`}
                  </h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setForm(null)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted small">{monthLabel(period.month, period.year)}</p>
                  <div className="row g-3">
                    {form.mode === "create" && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">Employee</label>
                        <select required className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                          <option value="">Select…</option>
                          {employees.map((emp) => <option value={emp._id} key={emp._id}>{emp.name} — {String(emp.role || "").replace(/_/g, " ")}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="col-6">
                      <label className="form-label fw-semibold">Sales target (₹)</label>
                      <input type="number" min="0" step="1000" className="form-control" value={form.salesTarget} onChange={(e) => setForm({ ...form, salesTarget: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Visit target</label>
                      <input type="number" min="0" className="form-control" value={form.visitTarget} onChange={(e) => setForm({ ...form, visitTarget: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Project <span className="text-muted fw-normal">(optional)</span></label>
                      <select className="form-select" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                        <option value="">None</option>
                        {projects.map((project) => <option value={project._id} key={project._id}>{project.name}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Note <span className="text-muted fw-normal">(optional)</span></label>
                      <input className="form-control" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light border" onClick={() => setForm(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save target"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,.45)" }} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{detail.row.name} — {monthLabel(period.month, period.year)}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                {detailLoading || !detail.visits ? (
                  <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2"></span>Loading…</div>
                ) : (
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="fw-semibold small mb-2">Visits ({detail.visits.length})</div>
                      {detail.visits.length === 0 ? <div className="text-muted small">None this month.</div> : (
                        <ul className="list-unstyled mb-0" style={{ maxHeight: 260, overflowY: "auto" }}>
                          {detail.visits.map((visit) => (
                            <li key={visit._id} className="border-bottom py-1 small">
                              {fmtDate(visit.visitedAt)} · {visit.doctorId?.name || visit.medicalId?.name || "—"}
                              {visit.doctorResponse && <span className="badge text-bg-light border ms-1">{visit.doctorResponse.replace(/_/g, " ").toLowerCase()}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div className="fw-semibold small mb-2">Sales ({detail.sales.length})</div>
                      {detail.sales.length === 0 ? <div className="text-muted small">None this month.</div> : (
                        <ul className="list-unstyled mb-0" style={{ maxHeight: 260, overflowY: "auto" }}>
                          {detail.sales.map((sale) => (
                            <li key={sale._id} className="border-bottom py-1 small d-flex justify-content-between">
                              <span>{fmtDate(sale.saleDate)} · {sale.doctorId?.name || "—"} {sale.productId?.name ? `(${sale.productId.name})` : ""}</span>
                              <span className="fw-semibold">{money(sale.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, sub, pct }) => (
  <div className="col-md-6">
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between">
          <div className="small text-muted">{label}</div>
          <div className={`small fw-semibold text-${progressColor(pct)}`}>{pct === null ? "—" : `${pct}%`}</div>
        </div>
        <div className="fs-4 fw-bold">{value}</div>
        <div className="progress my-1" style={{ height: "6px" }}>
          <div className={`progress-bar bg-${progressColor(pct)}`} style={{ width: `${Math.min(100, pct || 0)}%` }} />
        </div>
        <div className="small text-muted">{sub}</div>
      </div>
    </div>
  </div>
);

export default TargetsTab;
