import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

import visitApi from "../../api/visitApi";
import doctorApi from "../../api/doctorApi";
import userApi from "../../api/userApi";
import VisitDetailsModal from "../../components/VisitDetailsModal";
import {
  MANAGER_ROLES,
  errorMessage,
  monthLabel,
  recentMonths,
  RESPONSE_LABELS,
  fmtDate,
} from "../sales/salesShared";

const RESPONSE_CLASS = {
  POSITIVE: "text-bg-success",
  INTERESTED: "text-bg-success",
  NEGATIVE: "text-bg-danger",
  NOT_INTERESTED: "text-bg-danger",
  NEUTRAL: "text-bg-secondary",
  FOLLOW_UP_REQUIRED: "text-bg-warning",
};

const VisitReport = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const isManager = MANAGER_ROLES.includes(role);
  const months = useMemo(() => recentMonths(), []);
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      employeeId: "",
      doctorId: "",
      status: "",
      doctorResponse: searchParams.get("doctorResponse") || "",
    };
  });

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [employees, setEmployees] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { month: filters.month, year: filters.year };
      if (filters.employeeId) params.employeeId = filters.employeeId;
      if (filters.doctorId) params.doctorId = filters.doctorId;
      if (filters.status) params.status = filters.status;
      if (filters.doctorResponse) params.doctorResponse = filters.doctorResponse;
      const response = await visitApi.listVisits(params);
      setVisits(response.visits || []);
    } catch (err) {
      setError(errorMessage(err, "Unable to load visits"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    doctorApi.listDoctors().then((r) => setDoctors(r.doctors || [])).catch(() => setDoctors([]));
    if (isManager) userApi.listUsers().then((r) => setEmployees((r.users || []).filter((u) => u.active !== false))).catch(() => setEmployees([]));
  }, [isManager]);

  const set = (patch) => setFilters((current) => ({ ...current, ...patch }));

  const responseCounts = useMemo(() => {
    const counts = {};
    for (const visit of visits) {
      if (visit.doctorResponse) counts[visit.doctorResponse] = (counts[visit.doctorResponse] || 0) + 1;
    }
    return counts;
  }, [visits]);

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div
            className="card-body p-4 p-lg-5 text-white"
            style={{ background: "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)" }}
          >
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <i className="bi bi-clipboard-data fs-3"></i>
              </div>
              <div>
                <span className="small opacity-75">FIELD REPORTS</span>
                <h2 className="fw-bold mb-0">Visit Report</h2>
              </div>
            </div>
            <p className="mb-0 opacity-75">
              {isManager ? "Every visit in your scope with what was discussed and how the doctor responded." : "Your visit history."}
            </p>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-3">
          <div className="card-body p-3">
            <div className="row g-2">
              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-semibold mb-1">Month</label>
                <select
                  className="form-select form-select-sm"
                  value={`${filters.year}-${filters.month}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split("-").map(Number);
                    set({ year, month });
                  }}
                >
                  {months.map((m) => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{monthLabel(m.month, m.year)}</option>)}
                </select>
              </div>
              {isManager && (
                <div className="col-6 col-md-3 col-lg-2">
                  <label className="form-label small fw-semibold mb-1">Employee</label>
                  <select className="form-select form-select-sm" value={filters.employeeId} onChange={(e) => set({ employeeId: e.target.value })}>
                    <option value="">All</option>
                    {employees.map((emp) => <option value={emp._id} key={emp._id}>{emp.name}</option>)}
                  </select>
                </div>
              )}
              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-semibold mb-1">Doctor</label>
                <select className="form-select form-select-sm" value={filters.doctorId} onChange={(e) => set({ doctorId: e.target.value })}>
                  <option value="">All</option>
                  {doctors.map((doctor) => <option value={doctor._id} key={doctor._id}>{doctor.name}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-semibold mb-1">Response</label>
                <select className="form-select form-select-sm" value={filters.doctorResponse} onChange={(e) => set({ doctorResponse: e.target.value })}>
                  <option value="">All</option>
                  {Object.entries(RESPONSE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label small fw-semibold mb-1">Status</label>
                <select className="form-select form-select-sm" value={filters.status} onChange={(e) => set({ status: e.target.value })}>
                  <option value="">All</option>
                  <option value="completed">Completed</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger border-0 shadow-sm rounded-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge text-bg-light border">{visits.length} visits</span>
          {Object.entries(responseCounts).map(([response, count]) => (
            <span key={response} className={`badge ${RESPONSE_CLASS[response] || "text-bg-secondary"}`}>
              {RESPONSE_LABELS[response]}: {count}
            </span>
          ))}
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : visits.length === 0 ? (
            <div className="text-center text-muted py-5">No visits match these filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Date</th>
                    {isManager && <th className="py-3 border-0">Employee</th>}
                    <th className="py-3 border-0">Doctor / Chemist</th>
                    <th className="py-3 border-0">Discussion</th>
                    <th className="py-3 border-0">Response</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="py-3 border-0 pe-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => (
                    <tr key={visit._id}>
                      <td className="px-4 py-3">{fmtDate(visit.visitedAt)}</td>
                      {isManager && <td className="py-3">{visit.employeeId?.name || "—"}</td>}
                      <td className="py-3">{visit.doctorId?.name || visit.medicalId?.name || "—"}</td>
                      <td className="py-3">
                        <span className="text-muted small d-inline-block text-truncate" style={{ maxWidth: 260 }}>
                          {visit.discussion || "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        {visit.doctorResponse ? (
                          <span className={`badge ${RESPONSE_CLASS[visit.doctorResponse] || "text-bg-secondary"}`}>
                            {RESPONSE_LABELS[visit.doctorResponse]}
                          </span>
                        ) : <span className="text-muted small">—</span>}
                      </td>
                      <td className="py-3 text-capitalize">{String(visit.status || "").replace(/_/g, " ")}</td>
                      <td className="py-3 pe-4 text-end">
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setSelected(visit)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && <VisitDetailsModal visit={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default VisitReport;
