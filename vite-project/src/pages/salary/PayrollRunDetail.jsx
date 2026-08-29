import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import payrollApi from "../../api/payrollApi";
import { useNotify } from "../../components/NotificationProvider";
import { downloadBlob } from "../../utils/downloadBlob";

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATUS_STYLE = { DRAFT: "text-bg-secondary", APPROVED: "text-bg-primary", PAID: "text-bg-success" };

const PayrollRunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tdsEdits, setTdsEdits] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await payrollApi.getRun(id);
      setRun(response.run);
      setTdsEdits({});
    } catch (err) {
      setError(errorMessage(err, "Unable to load payroll run"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isDraft = run?.status === "DRAFT";
  const isApproved = run?.status === "APPROVED";

  const act = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) notify(successMsg);
      await load();
    } catch (err) {
      notify(errorMessage(err, "Action failed"), "", "error");
    } finally {
      setBusy(false);
    }
  };

  const saveLineEdits = async () => {
    const lines = Object.entries(tdsEdits).map(([employeeId, tds]) => ({ employeeId, tds: Number(tds) || 0 }));
    if (lines.length === 0) return;
    await act(() => payrollApi.updateRun(id, { lines }), "TDS updated");
  };

  const toggleExclude = (line) =>
    act(() => payrollApi.updateRun(id, { lines: [{ employeeId: line.employeeId, excluded: !line.excluded }] }));

  const downloadBankAdvice = async () => {
    try {
      const data = await payrollApi.getBankAdvice(id);
      const header = ["Employee", "Account holder", "Bank", "Account number", "IFSC", "Amount"];
      const rows = data.rows.map((r) => [r.employee, r.accountHolderName || "", r.bankName || "", r.accountNumber || "", r.ifscCode || "", r.amount]);
      const csv = [header, ...rows, ["", "", "", "", "Total", data.total]]
        .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `bank-advice-${data.year}-${String(data.month).padStart(2, "0")}.csv`);
    } catch (err) {
      notify(errorMessage(err, "Unable to build bank advice"), "", "error");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="card border-0 shadow-sm rounded-4"><div className="card-body text-center py-5"><div className="spinner-border text-primary"></div></div></div>
      </div>
    );
  }
  if (error || !run) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="alert alert-danger border-0 shadow-sm rounded-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error || "Not found"}</div>
        <Link to="/salary/runs" className="btn btn-outline-secondary">Back to payroll runs</Link>
      </div>
    );
  }

  const activeLines = run.lines.filter((line) => !line.excluded);

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">
        <button type="button" className="btn btn-sm btn-light border mb-3" onClick={() => navigate("/salary/runs")}>
          <i className="bi bi-arrow-left me-1"></i>Payroll runs
        </button>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h3 className="fw-bold mb-0">{MONTHS[run.month - 1]} {run.year}</h3>
                  <span className={`badge ${STATUS_STYLE[run.status]}`}>{run.status}</span>
                  {run.slipsGenerated && <span className="badge text-bg-light border">slips generated</span>}
                </div>
                <div className="text-muted small">
                  {run.totals.headcount} employees · {run.approvedAt ? `approved ${new Date(run.approvedAt).toLocaleDateString("en-IN")}` : "draft"}
                  {run.paidAt ? ` · paid ${new Date(run.paidAt).toLocaleDateString("en-IN")}` : ""}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {isDraft && (
                  <>
                    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => act(() => payrollApi.recomputeRun(id), "Recomputed from current salaries")}>
                      <i className="bi bi-arrow-clockwise me-1"></i>Recompute
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => { if (window.confirm("Delete this draft run?")) act(() => payrollApi.deleteRun(id)).then(() => navigate("/salary/runs")); }}>
                      Delete
                    </button>
                    <button type="button" className="btn btn-sm btn-primary" disabled={busy || activeLines.length === 0} onClick={() => act(() => payrollApi.approveRun(id), "Run approved")}>
                      <i className="bi bi-check-lg me-1"></i>Approve run
                    </button>
                  </>
                )}
                {isApproved && !run.slipsGenerated && (
                  <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => act(async () => { const r = await payrollApi.generateSlips(id); notify(`${r.created} slip(s) created, ${r.skipped} skipped`); }, null)}>
                    <i className="bi bi-file-earmark-plus me-1"></i>Generate {activeLines.length} slips
                  </button>
                )}
                {isApproved && run.slipsGenerated && (
                  <>
                    <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => act(async () => { const r = await payrollApi.sendSlips(id); notify(`Emailed ${r.sent}, ${r.failed} failed`); }, null)}>
                      <i className="bi bi-envelope me-1"></i>Email all slips
                    </button>
                    <button type="button" className="btn btn-sm btn-success" disabled={busy} onClick={() => act(() => payrollApi.markPaid(id), "Run marked paid")}>
                      Mark paid
                    </button>
                  </>
                )}
                {run.status !== "DRAFT" && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={downloadBankAdvice}>
                    <i className="bi bi-download me-1"></i>Bank advice (CSV)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <TotalCard label="Gross" value={money(run.totals.gross)} />
          <TotalCard label="PF" value={money(run.totals.pf)} />
          <TotalCard label="ESI" value={money(run.totals.esi)} />
          <TotalCard label="PT" value={money(run.totals.pt)} />
          <TotalCard label="TDS" value={money(run.totals.tds)} />
          <TotalCard label="Net payout" value={money(run.totals.net)} strong />
        </div>

        {isDraft && Object.keys(tdsEdits).length > 0 && (
          <div className="alert alert-info d-flex justify-content-between align-items-center py-2">
            <span className="small">{Object.keys(tdsEdits).length} TDS change(s) not saved</span>
            <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={saveLineEdits}>Save TDS changes</button>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: "#f8f9fc" }}>
                <tr>
                  <th className="px-4 py-3 border-0">Employee</th>
                  <th className="py-3 border-0">Gross</th>
                  <th className="py-3 border-0">LOP</th>
                  <th className="py-3 border-0">PF</th>
                  <th className="py-3 border-0">ESI</th>
                  <th className="py-3 border-0">PT</th>
                  <th className="py-3 border-0">TDS</th>
                  <th className="py-3 border-0">Net</th>
                  <th className="py-3 border-0 pe-4"></th>
                </tr>
              </thead>
              <tbody>
                {run.lines.map((line) => (
                  <tr key={String(line.employeeId)} className={line.excluded ? "text-muted" : ""}>
                    <td className="px-4 py-3">
                      <span className={line.excluded ? "text-decoration-line-through" : "fw-semibold"}>{line.employeeName}</span>
                      {line.slipId && <span className="badge text-bg-light border ms-1">slip</span>}
                      {!line.bankDetailsSnapshot?.accountNumber && !line.excluded && (
                        <span className="badge text-bg-warning ms-1" title="No bank details on file">no bank</span>
                      )}
                    </td>
                    <td className="py-3">{money(line.grossSalary)}</td>
                    <td className="py-3">{line.lopDays ? `${line.lopDays}d · ${money(line.lopDeduction)}` : "—"}</td>
                    <td className="py-3">{money(line.statutory?.pf)}</td>
                    <td className="py-3">{money(line.statutory?.esi)}</td>
                    <td className="py-3">{money(line.statutory?.pt)}</td>
                    <td className="py-3" style={{ width: 120 }}>
                      {isDraft && !line.excluded ? (
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={tdsEdits[String(line.employeeId)] ?? line.statutory?.tds ?? 0}
                          onChange={(e) => setTdsEdits({ ...tdsEdits, [String(line.employeeId)]: e.target.value })}
                        />
                      ) : money(line.statutory?.tds)}
                    </td>
                    <td className="py-3 fw-semibold">{money(line.netSalary)}</td>
                    <td className="py-3 pe-4 text-end">
                      {isDraft && (
                        <button type="button" className="btn btn-sm btn-light border" disabled={busy} onClick={() => toggleExclude(line)}>
                          {line.excluded ? "Include" : "Exclude"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const TotalCard = ({ label, value, strong }) => (
  <div className="col-6 col-md-2">
    <div className={`card border-0 shadow-sm rounded-4 h-100 ${strong ? "bg-primary text-white" : ""}`}>
      <div className="card-body py-3">
        <div className={`small ${strong ? "opacity-75" : "text-muted"}`}>{label}</div>
        <div className="fw-bold">{value}</div>
      </div>
    </div>
  </div>
);

export default PayrollRunDetail;
