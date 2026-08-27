import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import tourPlanApi from "../../api/tourPlanApi";
import doctorApi from "../../api/doctorApi";
import medicalApi from "../../api/medicalApi";
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
const toInput = (date) => (date ? new Date(date).toISOString().slice(0, 10) : "");

const placeName = (item) =>
  item.kind === "DOCTOR"
    ? item.doctorId?.name || "Doctor"
    : item.medicalId?.name || "Chemist";
const placeSub = (item) =>
  item.kind === "DOCTOR"
    ? [item.doctorId?.clinicName, item.doctorId?.city].filter(Boolean).join(" · ")
    : [item.medicalId?.area, item.medicalId?.city].filter(Boolean).join(" · ");

const TourPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();
  const currentUserId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  const role = useSelector((state) => state.auth.user?.role);
  const isReviewer = REVIEWER_ROLES.includes(role);

  const [plan, setPlan] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Draft editing state
  const [meta, setMeta] = useState({ title: "", periodStart: "", periodEnd: "" });
  const [newItem, setNewItem] = useState({ kind: "DOCTOR", refId: "", plannedDate: "", objective: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [planResult, doctorsResult, medicalsResult] = await Promise.all([
        tourPlanApi.getTourPlan(id),
        doctorApi.listDoctors(),
        medicalApi.listMedicals(),
      ]);
      setPlan(planResult.tourPlan);
      setMeta({
        title: planResult.tourPlan.title || "",
        periodStart: toInput(planResult.tourPlan.periodStart),
        periodEnd: toInput(planResult.tourPlan.periodEnd),
      });
      setDoctors(doctorsResult.doctors || []);
      setMedicals(medicalsResult.medicals || []);
    } catch (err) {
      setError(errorMessage(err, "Unable to load tour plan"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = plan && String(plan.employeeId?._id || plan.employeeId) === String(currentUserId);
  const editable = plan && ["DRAFT", "REJECTED"].includes(plan.status) && (isOwner || isReviewer);
  const canReview = plan && plan.status === "SUBMITTED" && isReviewer;

  // Serialize the current items to the shape the API expects.
  const itemsPayload = (items) =>
    items.map((item) => ({
      kind: item.kind,
      doctorId: item.kind === "DOCTOR" ? item.doctorId?._id || item.doctorId : undefined,
      medicalId: item.kind === "MEDICAL" ? item.medicalId?._id || item.medicalId : undefined,
      plannedDate: toInput(item.plannedDate),
      objective: item.objective || "",
      notes: item.notes || "",
    }));

  const persist = async (patch, successMsg) => {
    setBusy(true);
    try {
      await tourPlanApi.updateTourPlan(id, patch);
      if (successMsg) notify(successMsg);
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to save"), "", "error");
    } finally {
      setBusy(false);
    }
  };

  const saveMeta = () => {
    if (!meta.periodStart || !meta.periodEnd) return;
    persist({ title: meta.title.trim(), periodStart: meta.periodStart, periodEnd: meta.periodEnd }, "Plan details saved");
  };

  const addStop = () => {
    if (!newItem.refId || !newItem.plannedDate) return;
    const next = [
      ...plan.items,
      {
        kind: newItem.kind,
        [newItem.kind === "DOCTOR" ? "doctorId" : "medicalId"]: newItem.refId,
        plannedDate: newItem.plannedDate,
        objective: newItem.objective.trim(),
      },
    ];
    persist({ items: itemsPayload(next) }, "Stop added");
    setNewItem({ kind: "DOCTOR", refId: "", plannedDate: newItem.plannedDate, objective: "" });
  };

  const removeStop = (index) => {
    persist({ items: itemsPayload(plan.items.filter((_, i) => i !== index)) }, "Stop removed");
  };

  const submit = async () => {
    setBusy(true);
    try {
      await tourPlanApi.submitTourPlan(id);
      notify("Submitted for approval");
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to submit"), "", "error");
    } finally {
      setBusy(false);
    }
  };

  const review = async (action) => {
    const reviewNote =
      action === "reject"
        ? window.prompt("Reason for rejecting this plan:")
        : window.prompt("Approval note (optional):", "");
    if (reviewNote === null) return;
    if (action === "reject" && !reviewNote.trim()) return;
    setBusy(true);
    try {
      await tourPlanApi.reviewTourPlan(id, { action, reviewNote: reviewNote.trim() });
      notify(`Plan ${action === "approve" ? "approved" : "rejected"}`);
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to review"), "", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove this tour plan?")) return;
    try {
      await tourPlanApi.deleteTourPlan(id);
      notify("Tour plan removed");
      navigate("/tours");
    } catch (err) {
      notify(errorMessage(err, "Unable to remove"), "", "error");
    }
  };

  const sortedItems = useMemo(
    () => (plan ? [...plan.items].map((item, i) => ({ ...item, _i: i })).sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate)) : []),
    [plan]
  );

  if (loading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
            <p className="text-muted mb-0">Loading tour plan…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="alert alert-danger border-0 shadow-sm rounded-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error || "Tour plan not found"}
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/tours")}>Back to tour plans</button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        <button type="button" className="btn btn-sm btn-light border mb-3" onClick={() => navigate("/tours")}>
          <i className="bi bi-arrow-left me-1"></i>Tour plans
        </button>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h3 className="fw-bold mb-0">{plan.title || `Plan from ${fmt(plan.periodStart)}`}</h3>
                  <span className={`badge ${STATUS_STYLE[plan.status]}`}>{plan.status}</span>
                </div>
                <div className="text-muted">
                  {plan.employeeId?.name} · {fmt(plan.periodStart)} – {fmt(plan.periodEnd)} · {plan.items.length} stops · {plan.doneCount} done
                </div>
                {plan.reviewNote && (
                  <div className={`small mt-2 ${plan.status === "REJECTED" ? "text-danger" : "text-muted"}`}>
                    <i className="bi bi-chat-left-text me-1"></i>
                    {plan.reviewedBy?.name ? `${plan.reviewedBy.name}: ` : ""}{plan.reviewNote}
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                {plan.status !== "APPROVED" && (isOwner || isReviewer) && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={remove}>Remove</button>
                )}
                {editable && isOwner && (
                  <button type="button" className="btn btn-sm btn-primary" disabled={busy || !plan.items.length} onClick={submit}>
                    <i className="bi bi-send me-1"></i>Submit for approval
                  </button>
                )}
                {canReview && (
                  <>
                    <button type="button" className="btn btn-sm btn-success" disabled={busy} onClick={() => review("approve")}>Approve</button>
                    <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => review("reject")}>Reject</button>
                  </>
                )}
              </div>
            </div>

            {editable && (
              <div className="row g-2 align-items-end border-top pt-3">
                <div className="col-md-5">
                  <label className="form-label small fw-semibold mb-1">Title</label>
                  <input className="form-control form-control-sm" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold mb-1">From</label>
                  <input type="date" className="form-control form-control-sm" value={meta.periodStart} onChange={(e) => setMeta({ ...meta, periodStart: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold mb-1">To</label>
                  <input type="date" className="form-control form-control-sm" min={meta.periodStart} value={meta.periodEnd} onChange={(e) => setMeta({ ...meta, periodEnd: e.target.value })} />
                </div>
                <div className="col-md-1">
                  <button type="button" className="btn btn-sm btn-outline-primary w-100" disabled={busy} onClick={saveMeta}>Save</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {editable && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">Add a stop</h6>
              <div className="row g-2 align-items-end">
                <div className="col-sm-2">
                  <label className="form-label small fw-semibold mb-1">Type</label>
                  <select className="form-select form-select-sm" value={newItem.kind} onChange={(e) => setNewItem({ ...newItem, kind: e.target.value, refId: "" })}>
                    <option value="DOCTOR">Doctor</option>
                    <option value="MEDICAL">Chemist</option>
                  </select>
                </div>
                <div className="col-sm-4">
                  <label className="form-label small fw-semibold mb-1">{newItem.kind === "DOCTOR" ? "Doctor" : "Chemist"}</label>
                  <select className="form-select form-select-sm" value={newItem.refId} onChange={(e) => setNewItem({ ...newItem, refId: e.target.value })}>
                    <option value="">Select…</option>
                    {(newItem.kind === "DOCTOR" ? doctors : medicals).map((place) => (
                      <option value={place._id} key={place._id}>
                        {place.name}{place.city ? ` — ${place.city}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-3">
                  <label className="form-label small fw-semibold mb-1">Planned date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    min={meta.periodStart}
                    max={meta.periodEnd}
                    value={newItem.plannedDate}
                    onChange={(e) => setNewItem({ ...newItem, plannedDate: e.target.value })}
                  />
                </div>
                <div className="col-sm-2">
                  <label className="form-label small fw-semibold mb-1">Objective</label>
                  <input className="form-control form-control-sm" value={newItem.objective} onChange={(e) => setNewItem({ ...newItem, objective: e.target.value })} />
                </div>
                <div className="col-sm-1">
                  <button type="button" className="btn btn-sm btn-primary w-100" disabled={busy || !newItem.refId || !newItem.plannedDate} onClick={addStop}>Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 p-4">
            <h5 className="fw-bold mb-0">Planned stops</h5>
          </div>
          {sortedItems.length === 0 ? (
            <div className="text-center text-muted py-5">No stops planned yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Date</th>
                    <th className="py-3 border-0">Place</th>
                    <th className="py-3 border-0">Objective</th>
                    <th className="py-3 border-0">Outcome</th>
                    {editable && <th className="py-3 border-0 pe-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item._i}>
                      <td className="px-4 py-3">{fmt(item.plannedDate)}</td>
                      <td className="py-3">
                        <div className="fw-semibold">
                          <i className={`bi ${item.kind === "DOCTOR" ? "bi-heart-pulse" : "bi-hospital"} me-1 text-muted`}></i>
                          {placeName(item)}
                        </div>
                        {placeSub(item) && <div className="small text-muted">{placeSub(item)}</div>}
                      </td>
                      <td className="py-3"><span className="small text-muted">{item.objective || "—"}</span></td>
                      <td className="py-3">
                        {item.visited ? (
                          <span className="badge text-bg-success">Visited {fmt(item.visitedAt)}</span>
                        ) : new Date(item.plannedDate) < new Date() ? (
                          <span className="badge text-bg-danger">Missed</span>
                        ) : (
                          <span className="badge text-bg-secondary">Planned</span>
                        )}
                      </td>
                      {editable && (
                        <td className="py-3 pe-4 text-end">
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => removeStop(item._i)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      )}
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

export default TourPlanDetail;
