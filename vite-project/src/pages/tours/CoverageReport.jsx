import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import tourPlanApi from "../../api/tourPlanApi";
import territoryApi from "../../api/territoryApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader, Breadcrumbs } from "../../components/ui";

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const STATUS_META = {
  overdue: { label: "Overdue", cls: "text-bg-danger" },
  never: { label: "Never visited", cls: "text-bg-dark" },
  due: { label: "Due soon", cls: "text-bg-warning" },
  ok: { label: "On track", cls: "text-bg-success" },
};

const fmt = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const CoverageReport = () => {
  const { notify } = useNotify();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [territories, setTerritories] = useState([]);
  const [territoryId, setTerritoryId] = useState("");
  const [days, setDays] = useState(21);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await tourPlanApi.getDoctorCoverage({
        days,
        ...(territoryId ? { territoryId } : {}),
      });
      setRows(response.coverage || []);
      setSummary(response.summary || null);
    } catch (err) {
      notify(errorMessage(err, "Unable to load coverage report"), "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territoryId, days]);

  useEffect(() => {
    territoryApi.listTerritories().then((r) => setTerritories(r.territories || [])).catch(() => setTerritories([]));
  }, []);

  const visible = statusFilter === "all" ? rows : rows.filter((row) => row.status === statusFilter);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Tour Plans", to: "/tours" }, { label: "Doctor Coverage" }]} />
      <PageHeader
        eyebrow="Field planning"
        title="Doctor Coverage"
        description="How long since each doctor was last visited. Overdue doctors are listed first."
      />

      <div className="container-fluid px-0">

        {summary && (
          <div className="row g-3 mb-4">
            {[
              ["overdue", summary.overdue, "danger"],
              ["never", summary.never, "dark"],
              ["due", summary.due, "warning"],
              ["ok", summary.ok, "success"],
            ].map(([key, value, color]) => (
              <div className="col-6 col-lg-3" key={key}>
                <button
                  type="button"
                  className={`card border-0 shadow-sm rounded-4 w-100 text-start ${statusFilter === key ? "border border-2" : ""}`}
                  onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                >
                  <div className="card-body">
                    <div className={`fs-3 fw-bold text-${color}`}>{value}</div>
                    <div className="small text-muted">{STATUS_META[key].label}</div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4 d-flex flex-wrap gap-3 align-items-end">
            <div>
              <label className="form-label small fw-semibold mb-1">Territory</label>
              <select className="form-select form-select-sm" style={{ minWidth: 180 }} value={territoryId} onChange={(e) => setTerritoryId(e.target.value)}>
                <option value="">All territories</option>
                {territories.map((territory) => <option value={territory._id} key={territory._id}>{territory.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label small fw-semibold mb-1">Overdue after</label>
              <select className="form-select form-select-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[7, 14, 21, 30, 45, 60].map((d) => <option value={d} key={d}>{d} days</option>)}
              </select>
            </div>
            {statusFilter !== "all" && (
              <button type="button" className="btn btn-sm btn-link" onClick={() => setStatusFilter("all")}>Clear status filter</button>
            )}
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center text-muted py-5">
              {rows.length === 0 ? "No doctors match this scope." : "Nothing in this status."}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Doctor</th>
                    <th className="py-3 border-0">Territory</th>
                    <th className="py-3 border-0">Last visit</th>
                    <th className="py-3 border-0">Days since</th>
                    <th className="py-3 border-0">Visits</th>
                    <th className="py-3 border-0 pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.doctorId}>
                      <td className="px-4 py-3">
                        <Link to={`/doctors/${row.doctorId}`} className="fw-semibold text-decoration-none text-dark">{row.name}</Link>
                        <div className="small text-muted">{[row.clinicName, row.specialty].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="py-3">{row.territory || <span className="text-muted small">Unassigned</span>}</td>
                      <td className="py-3">{fmt(row.lastVisitAt)}</td>
                      <td className="py-3 fw-semibold">{row.daysSince === null ? "—" : row.daysSince}</td>
                      <td className="py-3">{row.visitCount}</td>
                      <td className="py-3 pe-4">
                        <span className={`badge ${STATUS_META[row.status].cls}`}>{STATUS_META[row.status].label}</span>
                      </td>
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

export default CoverageReport;
