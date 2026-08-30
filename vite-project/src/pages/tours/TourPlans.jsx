import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import tourPlanApi from "../../api/tourPlanApi";
import userApi from "../../api/userApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader, FormSection, DataTable, EmptyState } from "../../components/ui";

const REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const STATUS_VARIANT = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",
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

  const columns = [
    {
      key: "title",
      header: "Plan",
      render: (plan) => (
        <Link to={`/tours/${plan._id}`} className="fw-semibold text-reset text-decoration-none">
          {plan.title || `Plan from ${fmt(plan.periodStart)}`}
        </Link>
      ),
    },
    ...(scope === "team" ? [{ key: "rep", header: "Rep", render: (p) => p.employeeId?.name || "—" }] : []),
    { key: "period", header: "Period", render: (p) => `${fmt(p.periodStart)} – ${fmt(p.periodEnd)}` },
    { key: "stops", header: "Stops", render: (p) => p.itemCount },
    {
      key: "status",
      header: "Status",
      render: (plan) => (
        <>
          <span className={`mf-badge mf-badge--${STATUS_VARIANT[plan.status] || "neutral"}`}>{plan.status}</span>
          {plan.status === "REJECTED" && plan.reviewNote && (
            <div className="small text-danger mt-1" style={{ maxWidth: 240 }}>{plan.reviewNote}</div>
          )}
        </>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (plan) => <Link to={`/tours/${plan._id}`} className="btn btn-sm btn-outline-primary rounded-3">Open</Link>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Field planning"
        title="Tour Plans"
        description="Plan the week's doctor and chemist visits, get them approved, and track what actually happened."
        actions={
          <>
            <Link to="/tours/coverage" className="btn btn-ghost rounded-3">
              <i className="bi bi-radar me-1"></i> Coverage report
            </Link>
            <button type="button" className="btn btn-primary rounded-3 fw-semibold" onClick={() => setCreating((v) => !v)}>
              <i className="bi bi-plus-lg me-1"></i> New plan
            </button>
          </>
        }
      />

      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-0">
          <i className="bi bi-exclamation-triangle-fill"></i> {error}
        </div>
      )}

      {isReviewer && (
        <div className="btn-group" role="group">
          <button type="button" className={`btn btn-sm ${scope === "mine" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setScope("mine")}>My plans</button>
          <button type="button" className={`btn btn-sm ${scope === "team" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setScope("team")}>
            Team {pendingReview > 0 && <span className="badge bg-danger ms-1">{pendingReview}</span>}
          </button>
        </div>
      )}

      {creating && (
        <div className="card border-0 shadow-sm rounded-4">
          <form className="card-body p-4" onSubmit={submitCreate}>
            <FormSection title="New tour plan">
              <div>
                <label className="form-label fw-semibold">Title <span className="text-muted fw-normal">(optional)</span></label>
                <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Week 32 – Pune West" />
              </div>
              {isReviewer && (
                <div>
                  <label className="form-label fw-semibold">For</label>
                  <select className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                    <option value="">Myself</option>
                    {reps.map((rep) => <option value={rep._id} key={rep._id}>{rep.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label fw-semibold">From</label>
                <input type="date" className="form-control" required value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
              </div>
              <div>
                <label className="form-label fw-semibold">To</label>
                <input type="date" className="form-control" required min={form.periodStart} value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
              </div>
            </FormSection>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light border" onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating…" : "Create & add stops"}</button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={plans}
        pageSize={25}
        rowKey={(p) => p._id}
        loading={loading}
        mobileCards
        empty={
          <EmptyState
            icon="bi-signpost-split"
            title="No tour plans yet"
            description="Create a plan for the week and add the doctors and chemists you intend to visit."
          />
        }
      />
    </PageContainer>
  );
};

export default TourPlans;
