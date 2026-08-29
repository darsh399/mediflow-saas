import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import doctorCrmApi from "../../api/doctorCrmApi";
import territoryApi from "../../api/territoryApi";
import { useNotify } from "../../components/NotificationProvider";

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const TIER_STYLE = { A: "text-bg-success", B: "text-bg-primary", C: "text-bg-warning", UNGRADED: "text-bg-secondary" };

const DoctorEngagement = () => {
  const { notify } = useNotify();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ tier: "", territoryId: "", specialty: "", days: 30, quick: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = { days: filters.days };
      if (filters.tier) params.tier = filters.tier;
      if (filters.territoryId) params.territoryId = filters.territoryId;
      if (filters.specialty) params.specialty = filters.specialty;
      if (filters.quick === "overdue") params.overdue = "true";
      if (filters.quick === "birthday") params.birthday = "true";
      if (filters.quick === "followUp") params.followUp = "true";
      if (filters.quick === "consent") params.consent = "true";
      const response = await doctorCrmApi.listEngagement(params);
      setRows(response.doctors || []);
      setSummary(response.summary || null);
    } catch (err) {
      notify(errorMessage(err, "Unable to load engagement list"), "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    territoryApi.listTerritories().then((r) => setTerritories(r.territories || [])).catch(() => setTerritories([]));
  }, []);

  const set = (patch) => setFilters((current) => ({ ...current, ...patch }));

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-body p-4 p-lg-5 text-white" style={{ background: "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)" }}>
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <i className="bi bi-people fs-3"></i>
              </div>
              <div>
                <span className="small opacity-75">DOCTOR CRM</span>
                <h2 className="fw-bold mb-0">Doctor Engagement</h2>
              </div>
            </div>
            <p className="mb-0 opacity-75">Who to engage and why — by tier, coverage gap, birthday and follow-up.</p>
          </div>
        </div>

        {summary && (
          <div className="row g-3 mb-3">
            {[
              ["", "All", summary.total, "dark"],
              ["overdue", "Overdue", summary.overdue, "danger"],
              ["birthday", "Birthday this month", summary.birthdays, "info"],
              ["followUp", "Follow-up due", summary.dueFollowUp, "warning"],
            ].map(([quick, label, value, color]) => (
              <div className="col-6 col-lg-3" key={label}>
                <button
                  type="button"
                  className={`card border-0 shadow-sm rounded-4 w-100 text-start ${filters.quick === quick && quick ? "border border-2" : ""}`}
                  onClick={() => set({ quick: filters.quick === quick ? "" : quick })}
                >
                  <div className="card-body">
                    <div className={`fs-3 fw-bold text-${color}`}>{value}</div>
                    <div className="small text-muted">{label}</div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 mb-3">
          <div className="card-body p-3 d-flex flex-wrap gap-3 align-items-end">
            <div>
              <label className="form-label small fw-semibold mb-1">Tier</label>
              <select className="form-select form-select-sm" value={filters.tier} onChange={(e) => set({ tier: e.target.value })}>
                <option value="">All</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="UNGRADED">Ungraded</option>
              </select>
            </div>
            <div>
              <label className="form-label small fw-semibold mb-1">Territory</label>
              <select className="form-select form-select-sm" style={{ minWidth: 160 }} value={filters.territoryId} onChange={(e) => set({ territoryId: e.target.value })}>
                <option value="">All</option>
                {territories.map((t) => <option value={t._id} key={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label small fw-semibold mb-1">Specialty</label>
              <input className="form-control form-control-sm" value={filters.specialty} onChange={(e) => set({ specialty: e.target.value })} placeholder="e.g. Cardiology" />
            </div>
            <div>
              <label className="form-label small fw-semibold mb-1">Overdue after</label>
              <select className="form-select form-select-sm" value={filters.days} onChange={(e) => set({ days: Number(e.target.value) })}>
                {[15, 30, 45, 60, 90].map((d) => <option value={d} key={d}>{d} days</option>)}
              </select>
            </div>
            {filters.quick === "consent" && <button type="button" className="btn btn-sm btn-link" onClick={() => set({ quick: "" })}>Clear consent filter</button>}
            <button type="button" className={`btn btn-sm ${filters.quick === "consent" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => set({ quick: filters.quick === "consent" ? "" : "consent" })}>
              Consented only
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : rows.length === 0 ? (
            <div className="text-center text-muted py-5">No doctors match these filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Doctor</th>
                    <th className="py-3 border-0">Tier</th>
                    <th className="py-3 border-0">Territory</th>
                    <th className="py-3 border-0">Visits</th>
                    <th className="py-3 border-0">Last activity</th>
                    <th className="py-3 border-0">Signals</th>
                    <th className="py-3 border-0 pe-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._id}>
                      <td className="px-4 py-3">
                        <Link to={`/doctors/${row._id}`} className="fw-semibold text-decoration-none text-dark">{row.name}</Link>
                        <div className="small text-muted">{[row.clinicName, row.specialty].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="py-3"><span className={`badge ${TIER_STYLE[row.tier]}`}>{row.tier}</span></td>
                      <td className="py-3">{row.territory || <span className="text-muted small">—</span>}</td>
                      <td className="py-3">{row.visitCount}</td>
                      <td className="py-3">
                        {row.daysSince === null ? <span className="text-danger small">Never</span> : `${row.daysSince}d ago`}
                        <div className="small text-muted">{fmt(row.lastActivityAt)}</div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex flex-wrap gap-1">
                          {row.overdue && <span className="badge text-bg-danger">overdue</span>}
                          {row.birthdayThisMonth && <span className="badge text-bg-info">birthday</span>}
                          {row.anniversaryThisMonth && <span className="badge text-bg-info">anniversary</span>}
                          {row.nextFollowUp && <span className="badge text-bg-warning">follow-up {fmt(row.nextFollowUp)}</span>}
                          {row.marketingConsent && <span className="badge text-bg-light border">consent</span>}
                        </div>
                      </td>
                      <td className="py-3 pe-4 text-end">
                        <Link to={`/doctors/${row._id}`} className="btn btn-sm btn-outline-primary rounded-3">Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorEngagement;
