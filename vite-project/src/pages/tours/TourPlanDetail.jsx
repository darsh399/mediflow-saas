import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { PageContainer, Breadcrumbs, SkeletonTable } from "../../components/ui";
import tourPlanApi from "../../api/tourPlanApi";
import doctorApi from "../../api/doctorApi";
import medicalApi from "../../api/medicalApi";
import visitApi from "../../api/visitApi";
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
  const [selection, setSelection] = useState([]);
  const [filters, setFilters] = useState({ search: "", city: "", territory: "", clinic: "" });

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
  const editable =
    plan &&
    ["DRAFT", "REJECTED", "SUBMITTED"].includes(plan.status) &&
    ((isOwner && ["DRAFT", "REJECTED"].includes(plan.status)) ||
      (isReviewer && ["DRAFT", "REJECTED", "SUBMITTED"].includes(plan.status)));
  const canReview = plan && plan.status === "SUBMITTED" && isReviewer;
  const isMr = role === "mr";

  const handleAddVisit = async (item) => {
    if (!item || item.visited) return;

    const itemDateKey = item.plannedDate ? new Date(item.plannedDate).toISOString().slice(0, 10) : null;
    const todayKey = new Date().toISOString().slice(0, 10);

    if (!itemDateKey || itemDateKey !== todayKey) {
      const plannedLabel = item.plannedDate ? new Date(item.plannedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "the planned date";
      notify(`This stop is planned for ${plannedLabel}. You can only record visits for today’s plan.`, "", "error");
      return;
    }

    if (!navigator.geolocation) {
      notify("Location access is required to record this visit.", "", "error");
      return;
    }

    setBusy(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
      });

      const payload = {
        currentLatitude: position.coords.latitude,
        currentLongitude: position.coords.longitude,
        purpose: item.objective || "planned_visit",
        notes: item.objective || "",
      };

      if (item.kind === "DOCTOR") {
        payload.doctorId = item.doctorId?._id || item.doctorId;
        await visitApi.doctorVisit(payload);
      } else {
        payload.medicalId = item.medicalId?._id || item.medicalId;
        await visitApi.medicalVisit(payload);
      }

      notify("Visit recorded successfully");
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to record visit"), "", "error");
    } finally {
      setBusy(false);
    }
  };

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

  const isDuplicateSelection = (placeId) => {
    if (!plan) return false;
    return plan.items.some((item) => item.kind === newItem.kind && item.plannedDate && new Date(item.plannedDate).toISOString().slice(0, 10) === newItem.plannedDate && (newItem.kind === "DOCTOR" ? (item.doctorId?._id || item.doctorId) === placeId : (item.medicalId?._id || item.medicalId) === placeId));
  };

  const isPlannedForSelectedDate = (placeId) => {
    if (!plan || !newItem.plannedDate) return false;
    const selectedDateKey = new Date(newItem.plannedDate).toISOString().slice(0, 10);
    return plan.items.some((item) => {
      if (!item.plannedDate || item.kind !== newItem.kind) return false;
      const itemDateKey = new Date(item.plannedDate).toISOString().slice(0, 10);
      if (itemDateKey !== selectedDateKey) return false;
      return newItem.kind === "DOCTOR"
        ? (item.doctorId?._id || item.doctorId) === placeId
        : (item.medicalId?._id || item.medicalId) === placeId;
    });
  };

  const addSelectedStops = async () => {
    if (!selection.length || !newItem.plannedDate) {
      notify("Choose at least one doctor and a planned date", "", "error");
      return;
    }

    const nextItems = [...plan.items];
    for (const placeId of selection) {
      if (isDuplicateSelection(placeId)) {
        notify("Doctor already exists in this plan.", "", "error");
        continue;
      }
      nextItems.push({
        kind: newItem.kind,
        ...(newItem.kind === "DOCTOR" ? { doctorId: { _id: placeId } } : { medicalId: { _id: placeId } }),
        plannedDate: newItem.plannedDate,
        objective: newItem.objective.trim(),
        notes: "",
      });
    }

    if (nextItems.length === plan.items.length) return;
    await persist({ items: itemsPayload(nextItems) }, "New stops added");
    setSelection([]);
  };

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
    if (isDuplicateSelection(newItem.refId)) {
      notify("Doctor already exists in this plan.", "", "error");
      return;
    }
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

  const filteredPlaces = useMemo(() => {
    const source = newItem.kind === "DOCTOR" ? doctors : medicals;
    return source.filter((place) => {
      const search = filters.search.trim().toLowerCase();
      const matchesSearch = !search || [place.name, place.clinicName, place.city, place.district, place.state, place.territoryId?.name].filter(Boolean).join(" ").toLowerCase().includes(search);
      const matchesCity = !filters.city || (place.city || "").toLowerCase() === filters.city.toLowerCase();
      const matchesClinic = !filters.clinic || (place.clinicName || place.area || "").toLowerCase().includes(filters.clinic.toLowerCase());
      const matchesTerritory = !filters.territory || (place.territoryId?.name || place.territory || "").toLowerCase().includes(filters.territory.toLowerCase());
      const alreadyPlanned = isPlannedForSelectedDate(place._id);
      return matchesSearch && matchesCity && matchesClinic && matchesTerritory && !alreadyPlanned;
    });
  }, [doctors, medicals, filters, newItem.kind, newItem.plannedDate, plan]);

  const sortedItems = useMemo(
    () => (plan ? [...plan.items].map((item, i) => ({ ...item, _i: i })).sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate)) : []),
    [plan]
  );

  if (loading) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: "Tour Plans", to: "/tours" }, { label: "Plan" }]} />
        <SkeletonTable rows={6} columns={4} />
      </PageContainer>
    );
  }

  if (error || !plan) {
    return (
      <PageContainer width="narrow">
        <div className="alert alert-danger border-0 shadow-sm mb-0">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error || "Tour plan not found"}
        </div>
        <button type="button" className="btn btn-ghost rounded-3" onClick={() => navigate("/tours")}>Back to tour plans</button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Tour Plans", to: "/tours" }, { label: plan.title || "Plan" }]} />

      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(13,110,253,0.06), rgba(25,135,84,0.04), white)" }}>
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                    <i className="bi bi-map fs-5"></i>
                  </div>
                  <div>
                    <div className="small text-uppercase text-muted fw-semibold letter-spacing">Tour plan review</div>
                    <h3 className="fw-bold mb-0">{plan.title || `Plan from ${fmt(plan.periodStart)}`}</h3>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <span className={`badge ${STATUS_STYLE[plan.status]} rounded-pill px-2 py-2`}>{plan.status}</span>
                  <span className="badge bg-light text-dark border rounded-pill px-2 py-2">{plan.employeeId?.name}</span>
                  <span className="badge bg-light text-dark border rounded-pill px-2 py-2">{fmt(plan.periodStart)} – {fmt(plan.periodEnd)}</span>
                </div>
                {plan.reviewNote && (
                  <div className={`small mt-3 rounded-3 px-3 py-2 ${plan.status === "REJECTED" ? "bg-danger-subtle text-danger" : "bg-light text-muted"}`}>
                    <i className="bi bi-chat-left-text me-1"></i>
                    {plan.reviewedBy?.name ? `${plan.reviewedBy.name}: ` : ""}{plan.reviewNote}
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap justify-content-end align-items-center gap-2">
                {plan.status !== "APPROVED" && (isOwner || isReviewer) && (
                  <button type="button" className="btn btn-sm btn-outline-danger rounded-3" onClick={remove}><i className="bi bi-trash me-1"></i>Remove</button>
                )}
                {editable && isOwner && ["DRAFT", "REJECTED"].includes(plan.status) && (
                  <button type="button" className="btn btn-sm btn-primary rounded-3" disabled={busy || !plan.items.length} onClick={submit}>
                    <i className="bi bi-send me-1"></i>Submit for approval
                  </button>
                )}
                {canReview && (
                  <div className="d-flex align-items-center gap-2 rounded-3 border bg-white px-2 py-1 shadow-sm">
                    <span className="small text-muted">Reviewing</span>
                    <button type="button" className="btn btn-sm btn-success rounded-3" disabled={busy} onClick={() => review("approve")}>Approve</button>
                    <button type="button" className="btn btn-sm btn-outline-danger rounded-3" disabled={busy} onClick={() => review("reject")}>Reject</button>
                  </div>
                )}
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-md-3 col-sm-6">
                <div className="rounded-4 border bg-white p-3 h-100 shadow-sm">
                  <div className="small text-muted mb-1">Stops</div>
                  <div className="fw-bold fs-5">{plan.items.length}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="rounded-4 border bg-white p-3 h-100 shadow-sm">
                  <div className="small text-muted mb-1">Done</div>
                  <div className="fw-bold fs-5 text-success">{plan.doneCount}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="rounded-4 border bg-white p-3 h-100 shadow-sm">
                  <div className="small text-muted mb-1">From</div>
                  <div className="fw-bold small">{fmt(plan.periodStart)}</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="rounded-4 border bg-white p-3 h-100 shadow-sm">
                  <div className="small text-muted mb-1">To</div>
                  <div className="fw-bold small">{fmt(plan.periodEnd)}</div>
                </div>
              </div>
            </div>

            {editable && (
              <div className="row g-2 align-items-end border-top pt-3 mt-2">
                <div className="col-md-5">
                  <label className="form-label small fw-semibold mb-1">Plan title</label>
                  <input className="form-control form-control-sm rounded-3" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold mb-1">From</label>
                  <input type="date" className="form-control form-control-sm rounded-3" value={meta.periodStart} onChange={(e) => setMeta({ ...meta, periodStart: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold mb-1">To</label>
                  <input type="date" className="form-control form-control-sm rounded-3" min={meta.periodStart} value={meta.periodEnd} onChange={(e) => setMeta({ ...meta, periodEnd: e.target.value })} />
                </div>
                <div className="col-md-1">
                  <button type="button" className="btn btn-sm btn-outline-primary rounded-3 w-100" disabled={busy} onClick={saveMeta}>Save</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {editable && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div>
                  <div className="small text-uppercase text-muted fw-semibold">Plan editor</div>
                  <h6 className="fw-bold mb-0">Add a stop</h6>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary rounded-3" disabled={busy || !newItem.plannedDate} onClick={() => setSelection([])}>
                  <i className="bi bi-x-lg me-1"></i>Clear selected
                </button>
              </div>

              <div className="row g-2 align-items-end mb-3">
                <div className="col-sm-2">
                  <label className="form-label small fw-semibold mb-1">Type</label>
                  <select className="form-select form-select-sm rounded-3" value={newItem.kind} onChange={(e) => { setNewItem({ ...newItem, kind: e.target.value, refId: "" }); setSelection([]); }}>
                    <option value="DOCTOR">Doctor</option>
                    <option value="MEDICAL">Chemist</option>
                  </select>
                </div>
                <div className="col-sm-3">
                  <label className="form-label small fw-semibold mb-1">Planned date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm rounded-3"
                    min={meta.periodStart}
                    max={meta.periodEnd}
                    value={newItem.plannedDate}
                    onChange={(e) => setNewItem({ ...newItem, plannedDate: e.target.value })}
                  />
                </div>
                <div className="col-sm-3">
                  <label className="form-label small fw-semibold mb-1">Objective</label>
                  <input className="form-control form-control-sm rounded-3" value={newItem.objective} onChange={(e) => setNewItem({ ...newItem, objective: e.target.value })} />
                </div>
                <div className="col-sm-4">
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-sm btn-primary rounded-3 flex-fill" disabled={busy || !selection.length || !newItem.plannedDate} onClick={addSelectedStops}>Add selected</button>
                    <button type="button" className="btn btn-sm btn-outline-primary rounded-3 flex-fill" disabled={busy || !newItem.refId || !newItem.plannedDate} onClick={addStop}>Add one</button>
                  </div>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-3">
                  <input className="form-control form-control-sm rounded-3" placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <input className="form-control form-control-sm rounded-3" placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <input className="form-control form-control-sm rounded-3" placeholder="Territory" value={filters.territory} onChange={(e) => setFilters({ ...filters, territory: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <input className="form-control form-control-sm rounded-3" placeholder={newItem.kind === "DOCTOR" ? "Clinic name" : "Area"} value={filters.clinic} onChange={(e) => setFilters({ ...filters, clinic: e.target.value })} />
                </div>
                <div className="col-md-2 text-end align-self-center">
                  <span className="small text-muted bg-light rounded-pill px-2 py-1">{filteredPlaces.length} match</span>
                </div>
              </div>

              <div className="border rounded-4 p-2 bg-light-subtle" style={{ maxHeight: 280, overflowY: "auto" }}>
                {filteredPlaces.length === 0 ? (
                  <div className="text-muted small px-2 py-3">No matches for the current filters.</div>
                ) : filteredPlaces.map((place) => {
                  const id = place._id;
                  const selected = selection.includes(id);
                  const duplicate = isDuplicateSelection(id);
                  return (
                    <label key={id} className={`d-flex align-items-center justify-content-between gap-2 w-100 rounded-3 px-2 py-2 mb-2 ${selected ? "bg-primary-subtle border border-primary-subtle" : "bg-white border border-light-subtle"}`} style={{ cursor: "pointer" }}>
                      <span className="d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={duplicate}
                          onChange={(e) => {
                            if (e.target.checked) setSelection((prev) => [...prev, id]);
                            else setSelection((prev) => prev.filter((item) => item !== id));
                          }}
                        />
                        <span>
                          <strong>{place.name}</strong>
                          <div className="small text-muted">{place.clinicName || place.area || "—"} · {place.city || "—"} · {place.territoryId?.name || place.territory || "—"}</div>
                        </span>
                      </span>
                      {duplicate && <span className="small text-danger">Already in plan</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 p-4 pb-3">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div>
                <div className="small text-uppercase text-muted fw-semibold">Schedule</div>
                <h5 className="fw-bold mb-0">Planned stops</h5>
              </div>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">{sortedItems.length} total</span>
            </div>
          </div>
          {sortedItems.length === 0 ? (
            <div className="text-center text-muted py-5">No stops planned yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Date</th>
                    <th className="py-3 border-0">Place</th>
                    <th className="py-3 border-0">Objective</th>
                    <th className="py-3 border-0">Outcome</th>
                    {isMr && <th className="py-3 border-0 text-center">Action</th>}
                    {editable && <th className="py-3 border-0 pe-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item._i} className="align-middle">
                      <td className="px-4 py-3"><span className="fw-semibold">{fmt(item.plannedDate)}</span></td>
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
                          <span className="badge text-bg-success rounded-pill">Visited {fmt(item.visitedAt)}</span>
                        ) : new Date(item.plannedDate) < new Date() ? (
                          <span className="badge text-bg-danger rounded-pill">Missed</span>
                        ) : (
                          <span className="badge text-bg-secondary rounded-pill">Planned</span>
                        )}
                      </td>
                      {isMr && (
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary rounded-3"
                            disabled={busy || item.visited}
                            onClick={() => handleAddVisit(item)}
                          >
                            {item.visited ? "Visited" : "Add Visit"}
                          </button>
                        </td>
                      )}
                      {editable && (
                        <td className="py-3 pe-4 text-end">
                          <button type="button" className="btn btn-sm btn-outline-danger rounded-3" disabled={busy} onClick={() => removeStop(item._i)}>
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
    </PageContainer>
  );
};

export default TourPlanDetail;
