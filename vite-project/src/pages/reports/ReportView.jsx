import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";

import reportApi from "../../api/reportApi";
import { useNotify } from "../../components/NotificationProvider";
import { downloadBlob } from "../../utils/downloadBlob";
import { PageContainer, PageHeader, Breadcrumbs } from "../../components/ui";

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const TITLES = {
  attendance: "Attendance Report",
  leave: "Leave Report",
  expense: "Expense Report",
  sales: "Sales Report",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const recentMonths = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });
};

const ReportView = () => {
  const { type } = useParams();
  const { notify } = useNotify();
  const months = useMemo(() => recentMonths(), []);

  const [period, setPeriod] = useState(`${months[0].year}-${months[0].month}`);
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const valid = Boolean(TITLES[type]);

  const params = useMemo(() => {
    const [year, month] = period.split("-").map(Number);
    return { month, year, ...(employeeId ? { employeeId } : {}) };
  }, [period, employeeId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await reportApi.getReport(type, params));
    } catch (err) {
      setError(errorMessage(err, "Unable to load report"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!valid) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, params]);

  useEffect(() => {
    reportApi.getReportEmployees().then((r) => setEmployees(r.employees || [])).catch(() => setEmployees([]));
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await reportApi.downloadReport(type, params);
      downloadBlob(blob, `${type}-report-${params.year}-${String(params.month).padStart(2, "0")}.csv`);
    } catch (err) {
      notify(errorMessage(err, "Unable to export"), "", "error");
    } finally {
      setExporting(false);
    }
  };

  if (!valid) return <Navigate to="/reports" replace />;

  const render = (row, column) => {
    const value = row[column.key];
    return value === "" || value === null || value === undefined ? "—" : value;
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Reports", to: "/reports" }, { label: TITLES[type] }]} />
      <PageHeader
        eyebrow="Insights"
        title={TITLES[type]}
        description={data ? `${data.period}${data.scope === "team" ? " · your team" : ""}` : undefined}
      />

      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 mb-3">
          <div className="card-body p-3 d-flex flex-wrap gap-3 align-items-end">
            <div>
              <label className="form-label small fw-semibold mb-1">Month</label>
              <select className="form-select form-select-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
                {months.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{MONTHS[m.month - 1]} {m.year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label small fw-semibold mb-1">Employee</label>
              <select className="form-select form-select-sm" style={{ minWidth: 180 }} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">All</option>
                {employees.map((emp) => <option value={emp._id} key={emp._id}>{emp.name}</option>)}
              </select>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" disabled={exporting || !data?.rows?.length} onClick={exportCsv}>
              {exporting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-download me-2"></i>}
              Export CSV
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger border-0 shadow-sm rounded-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

        {data?.summary && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {Object.entries(data.summary).map(([label, value]) => (
              <span key={label} className="badge text-bg-light border px-3 py-2">
                <span className="text-muted">{label}:</span> <span className="fw-semibold">{value}</span>
              </span>
            ))}
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : !data?.rows?.length ? (
            <div className="text-center text-muted py-5">No data for this period.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                  <tr>
                    {data.columns.map((column) => (
                      <th key={column.key} className="py-3 border-0 px-3">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, index) => (
                    <tr key={index}>
                      {data.columns.map((column) => (
                        <td key={column.key} className="py-2 px-3">{render(row, column)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ReportView;
