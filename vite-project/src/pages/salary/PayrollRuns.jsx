import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import payrollApi from "../../api/payrollApi";
import userApi from "../../api/userApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader, SkeletonTable } from "../../components/ui";

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthLabel = (m, y) => `${MONTHS[m - 1]} ${y}`;

const STATUS_STYLE = { DRAFT: "text-bg-secondary", APPROVED: "text-bg-primary", PAID: "text-bg-success" };

const recentMonths = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });
};

const PayrollRuns = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const months = useMemo(() => recentMonths(), []);

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [newPeriod, setNewPeriod] = useState(`${months[0].year}-${months[0].month}`);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await payrollApi.listRuns();
      setRuns(response.runs || []);
    } catch (err) {
      setError(errorMessage(err, "Unable to load payroll runs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = async () => {
    setCreating(true);
    setPreview(null);
    await loadPreview(newPeriod);
  };

  const loadPreview = async (period) => {
    const [year, month] = period.split("-").map(Number);
    setPreviewLoading(true);
    try {
      const response = await payrollApi.previewRun({ month, year });
      setPreview(response);
    } catch (err) {
      notify(errorMessage(err, "Unable to preview"), "", "error");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmCreate = async () => {
    const [year, month] = newPeriod.split("-").map(Number);
    setSaving(true);
    try {
      const response = await payrollApi.createRun({ month, year });
      notify("Draft payroll run created");
      navigate(`/salary/runs/${response.run._id}`);
    } catch (err) {
      if (err?.response?.data?.runId) {
        navigate(`/salary/runs/${err.response.data.runId}`);
      } else {
        notify(errorMessage(err, "Unable to create run"), "", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const openSettings = async () => {
    setSettingsOpen(true);
    try {
      const response = await payrollApi.getSettings();
      setSettings(response.settings);
    } catch (err) {
      notify(errorMessage(err, "Unable to load settings"), "", "error");
      setSettingsOpen(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const response = await payrollApi.updateSettings(settings);
      setSettings(response.settings);
      notify("Statutory settings saved");
      setSettingsOpen(false);
    } catch (err) {
      notify(errorMessage(err, "Unable to save settings"), "", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Payroll"
        title="Payroll Runs"
        description="Run the whole month's payroll in one reviewed batch — LOP, PF, ESI, PT and TDS applied, then generate every slip at once."
        actions={
          <>
            <button type="button" className="btn btn-ghost rounded-3" onClick={() => setSummaryOpen(true)}>
              <i className="bi bi-file-earmark-text me-1"></i> Annual summary
            </button>
            <button type="button" className="btn btn-ghost rounded-3" onClick={openSettings}>
              <i className="bi bi-sliders me-1"></i> Statutory settings
            </button>
            <button type="button" className="btn btn-primary rounded-3 fw-semibold" onClick={startCreate}>
              <i className="bi bi-plus-lg me-1"></i> New run
            </button>
          </>
        }
      />

      <div className="container-fluid px-0">

        {error && <div className="alert alert-danger border-0 shadow-sm"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

        {loading ? (
          <SkeletonTable rows={6} columns={5} />
        ) : runs.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4"><div className="card-body text-center py-5">
            <i className="bi bi-cash-coin text-primary fs-1"></i>
            <h5 className="fw-bold mt-3">No payroll runs yet</h5>
            <p className="text-muted mb-0">Create a run for the month to generate everyone's slip together.</p>
          </div></div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Month</th>
                    <th className="py-3 border-0">Headcount</th>
                    <th className="py-3 border-0">Gross</th>
                    <th className="py-3 border-0">Deductions</th>
                    <th className="py-3 border-0">Net payout</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="py-3 border-0 pe-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run._id}>
                      <td className="px-4 py-3 fw-semibold">{monthLabel(run.month, run.year)}</td>
                      <td className="py-3">{run.totals?.headcount ?? 0}</td>
                      <td className="py-3">{money(run.totals?.gross)}</td>
                      <td className="py-3">{money(run.totals?.deductions)}</td>
                      <td className="py-3 fw-semibold">{money(run.totals?.net)}</td>
                      <td className="py-3">
                        <span className={`badge ${STATUS_STYLE[run.status]}`}>{run.status}</span>
                        {run.slipsGenerated && <span className="badge text-bg-light border ms-1">slips</span>}
                      </td>
                      <td className="py-3 pe-4 text-end">
                        <Link to={`/salary/runs/${run._id}`} className="btn btn-sm btn-outline-primary rounded-3">Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {creating && (
        <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,.45)" }} onClick={() => setCreating(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">New payroll run</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setCreating(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Month</label>
                <select
                  className="form-select mb-3"
                  value={newPeriod}
                  onChange={(e) => { setNewPeriod(e.target.value); loadPreview(e.target.value); }}
                >
                  {months.map((m) => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{monthLabel(m.month, m.year)}</option>)}
                </select>

                {previewLoading ? (
                  <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2"></span>Computing preview…</div>
                ) : preview ? (
                  <>
                    {preview.existingRunId && (
                      <div className="alert alert-warning py-2 small">
                        A run already exists for this month. <Link to={`/salary/runs/${preview.existingRunId}`}>Open it</Link>.
                      </div>
                    )}
                    <div className="row g-3 mb-3">
                      <div className="col-6 col-md-3"><Stat label="Employees" value={preview.totals.headcount} /></div>
                      <div className="col-6 col-md-3"><Stat label="Gross" value={money(preview.totals.gross)} /></div>
                      <div className="col-6 col-md-3"><Stat label="Deductions" value={money(preview.totals.deductions)} /></div>
                      <div className="col-6 col-md-3"><Stat label="Net payout" value={money(preview.totals.net)} /></div>
                    </div>
                    {preview.missingSalary.length > 0 && (
                      <div className="alert alert-light border py-2 small mb-0">
                        <i className="bi bi-info-circle me-1"></i>
                        {preview.missingSalary.length} employee(s) have no salary assigned and will be skipped: {preview.missingSalary.map((e) => e.name).join(", ")}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-light border" onClick={() => setCreating(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving || previewLoading || !preview || preview.totals.headcount === 0 || Boolean(preview.existingRunId)}
                  onClick={confirmCreate}
                >
                  {saving ? "Creating…" : "Create draft run"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && settings && (
        <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,.45)" }} onClick={() => setSettingsOpen(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4">
              <form onSubmit={saveSettings}>
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">Statutory settings</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setSettingsOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <StatutoryGroup title="Provident Fund" enabled={settings.pfEnabled} onToggle={(v) => setSettings({ ...settings, pfEnabled: v })}>
                    <NumField label="Rate %" value={settings.pfRate} onChange={(v) => setSettings({ ...settings, pfRate: v })} />
                    <NumField label="Wage ceiling ₹" value={settings.pfWageCeiling} onChange={(v) => setSettings({ ...settings, pfWageCeiling: v })} />
                    <CheckField label="Apply to full basic (ignore ceiling)" checked={settings.pfOnFullBasic} onChange={(v) => setSettings({ ...settings, pfOnFullBasic: v })} />
                  </StatutoryGroup>
                  <StatutoryGroup title="ESI" enabled={settings.esiEnabled} onToggle={(v) => setSettings({ ...settings, esiEnabled: v })}>
                    <NumField label="Employee rate %" value={settings.esiRate} onChange={(v) => setSettings({ ...settings, esiRate: v })} />
                    <NumField label="Gross threshold ₹" value={settings.esiGrossThreshold} onChange={(v) => setSettings({ ...settings, esiGrossThreshold: v })} />
                  </StatutoryGroup>
                  <StatutoryGroup title="Professional Tax" enabled={settings.ptEnabled} onToggle={(v) => setSettings({ ...settings, ptEnabled: v })}>
                    <NumField label="Monthly amount ₹" value={settings.ptAmount} onChange={(v) => setSettings({ ...settings, ptAmount: v })} />
                  </StatutoryGroup>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light border" onClick={() => setSettingsOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingSettings}>{savingSettings ? "Saving…" : "Save settings"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {summaryOpen && <AnnualSummaryModal onClose={() => setSummaryOpen(false)} />}
    </PageContainer>
  );
};

const Stat = ({ label, value }) => (
  <div className="border rounded-3 p-2 text-center">
    <div className="fw-bold">{value}</div>
    <div className="small text-muted">{label}</div>
  </div>
);

const StatutoryGroup = ({ title, enabled, onToggle, children }) => (
  <div className="border rounded-3 p-3 mb-2">
    <div className="form-check form-switch mb-2">
      <input className="form-check-input" type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} id={`sw-${title}`} />
      <label className="form-check-label fw-semibold" htmlFor={`sw-${title}`}>{title}</label>
    </div>
    {enabled && <div className="row g-2">{children}</div>}
  </div>
);

const NumField = ({ label, value, onChange }) => (
  <div className="col-6">
    <label className="form-label small mb-1">{label}</label>
    <input type="number" min="0" step="any" className="form-control form-control-sm" value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </div>
);

const CheckField = ({ label, checked, onChange }) => (
  <div className="col-12">
    <div className="form-check">
      <input className="form-check-input" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} id={`chk-${label}`} />
      <label className="form-check-label small" htmlFor={`chk-${label}`}>{label}</label>
    </div>
  </div>
);

const AnnualSummaryModal = ({ onClose }) => {
  const { notify } = useNotify();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userApi.listUsers().then((r) => setEmployees((r.users || []).filter((u) => u.active !== false))).catch(() => setEmployees([]));
  }, []);

  const run = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      setData(await payrollApi.getAnnualSummary({ employeeId, year }));
    } catch (err) {
      notify(errorMessage(err, "Unable to load summary"), "", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,.45)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 rounded-4">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">Annual salary summary</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold mb-1">Employee</label>
                <select className="form-select form-select-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="">Select…</option>
                  {employees.map((emp) => <option value={emp._id} key={emp._id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold mb-1">Year</label>
                <input type="number" className="form-control form-control-sm" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </div>
              <div className="col-md-3">
                <button type="button" className="btn btn-sm btn-primary w-100" onClick={run} disabled={!employeeId || loading}>
                  {loading ? "…" : "Show"}
                </button>
              </div>
            </div>

            {data && (
              <>
                <div className="row g-2 mb-3">
                  <div className="col-4"><Stat label="Gross" value={money(data.totals.gross)} /></div>
                  <div className="col-4"><Stat label="Deductions" value={money(data.totals.deductions)} /></div>
                  <div className="col-4"><Stat label="Net" value={money(data.totals.net)} /></div>
                </div>
                <div className="fw-semibold small mb-1">Deduction breakdown ({data.slipCount} slips in {data.year})</div>
                {Object.keys(data.deductionBreakdown).length === 0 ? (
                  <div className="text-muted small">No slips for this year.</div>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {Object.entries(data.deductionBreakdown).map(([name, amount]) => (
                      <li key={name} className="d-flex justify-content-between border-bottom py-1">
                        <span>{name}</span><span className="fw-semibold">{money(amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollRuns;
