import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import tourPlanApi from "../../api/tourPlanApi";
import userApi from "../../api/userApi";
import { useNotify } from "../../components/NotificationProvider";

const REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const STATUS_STYLE = {
  DRAFT: "text-bg-secondary",
  SUBMITTED: "text-bg-warning",
  APPROVED: "text-bg-success",
  REJECTED: "text-bg-danger",
};

const fmt = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const mondayOf = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const TourPlans = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const role = useSelector((state) => state.auth.user?.role);
  const isReviewer = REVIEWER_ROLES.includes(role);

  const [plans, setPlans] = useState([]);
  const [reps, setReps] = useState([]);
  const [scope, setScope] = useState("mine"); // mine | team
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const defaultStart = mondayOf(new Date());
  const [form, setForm] = useState({ title: "", periodStart: defaultStart, periodEnd: addDays(defaultStart, 6), employeeId: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = isReviewer && scope === "mine" ? { mine: "true" } : {};
      const response = await tourPlanApi.listTourPlans(params);
      setPlans(response.tourPlans || []);
    } catch (err) {
      setError(errorMessage(err, "Unable to load tour plans"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  useEffect(() => {
    if (!isReviewer) return;
    userApi.listUsers().then((r) => setReps((r.users || []).filter((u) => u.active !== false))).catch(() => setReps([]));
  }, [isReviewer]);

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        items: [],
        ...(form.employeeId ? { employeeId: form.employeeId } : {}),
      };
      const response = await tourPlanApi.createTourPlan(payload);
      notify("Tour plan created");
      navigate(`/tours/${response.tourPlan._id}`);
    } catch (err) {
      notify(errorMessage(err, "Unable to create tour plan"), "", "error");
    } finally {
      setSaving(false);
    }
  };

  const pendingReview = useMemo(() => plans.filter((plan) => plan.status === "SUBMITTED").length, [plans]);

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div
            className="card-body p-4 p-lg-5 text-white"
            style={{ background: "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)" }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <i className="bi bi-signpost-split fs-3"></i>
              </div>
              <div>
                <span className="small opacity-75">FIELD PLANNING</span>
                <h2 className="fw-bold mb-0">Tour Plans</h2>
              </div>
            </div>
            <p className="mb-0 opacity-75">Plan the week's doctor and chemist visits, get them approved, and track what actually happened.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          {isReviewer && (
            <div className="btn-group" role="group">
              <button type="button" className={`btn btn-sm ${scope === "mine" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setScope("mine")}>My plans</button>
              <button type="button" className={`btn btn-sm ${scope === "team" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setScope("team")}>
                Team {pendingReview > 0 && <span className="badge bg-danger ms-1">{pendingReview}</span>}
              </button>
            </div>
          )}
          <Link to="/tours/coverage" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-radar me-1"></i>Coverage report
          </Link>
          <button type="button" className="btn btn-sm btn-primary ms-auto" onClick={() => setCreating((v) => !v)}>
            <i className="bi bi-plus-lg me-1"></i>New Plan
          </button>
        </div>

        {creating && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <form className="card-body p-4" onSubmit={submitCreate}>
              <h5 className="fw-bold mb-3">New Tour Plan</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Title <span className="text-muted fw-normal">(optional)</span></label>
                  <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Week 32 – Pune West" />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">From</label>
                  <input type="date" className="form-control" required value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">To</label>
                  <input type="date" className="form-control" required min={form.periodStart} value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
                </div>
                {isReviewer && (
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">For</label>
                    <select className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                      <option value="">Myself</option>
                      {reps.map((rep) => <option value={rep._id} key={rep._id}>{rep.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="button" className="btn btn-light border" onClick={() => setCreating(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating…" : "Create & add stops"}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
              <p className="text-muted mb-0">Loading tour plans…</p>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <i className="bi bi-signpost-split text-primary fs-1"></i>
              <h5 className="fw-bold mt-3">No tour plans yet</h5>
              <p className="text-muted mb-0">Create a plan for the week and add the doctors and chemists you intend to visit.</p>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Plan</th>
                    {scope === "team" && <th className="py-3 border-0">Rep</th>}
                    <th className="py-3 border-0">Period</th>
                    <th className="py-3 border-0">Stops</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="py-3 border-0 pe-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan._id}>
                      <td className="px-4 py-3">
                        <Link to={`/tours/${plan._id}`} className="fw-semibold text-decoration-none text-dark">
                          {plan.title || `Plan from ${fmt(plan.periodStart)}`}
                        </Link>
                      </td>
                      {scope === "team" && <td className="py-3">{plan.employeeId?.name || "—"}</td>}
                      <td className="py-3">{fmt(plan.periodStart)} – {fmt(plan.periodEnd)}</td>
                      <td className="py-3">{plan.itemCount}</td>
                      <td className="py-3">
                        <span className={`badge ${STATUS_STYLE[plan.status] || "text-bg-secondary"}`}>{plan.status}</span>
                        {plan.status === "REJECTED" && plan.reviewNote && (
                          <div className="small text-danger mt-1" style={{ maxWidth: 240 }}>{plan.reviewNote}</div>
                        )}
                      </td>
                      <td className="py-3 pe-4 text-end">
                        <Link to={`/tours/${plan._id}`} className="btn btn-sm btn-outline-primary rounded-3">Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourPlans;
