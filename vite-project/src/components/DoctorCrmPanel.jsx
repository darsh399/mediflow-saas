import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import doctorCrmApi from "../api/doctorCrmApi";
import { useNotify } from "./NotificationProvider";

const CRM_ROLES = ["admin", "company_owner", "hr", "hr_manager", "mr", "manager", "project_manager"];
const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const TIER_STYLE = { A: "text-bg-success", B: "text-bg-primary", C: "text-bg-warning", UNGRADED: "text-bg-secondary" };
const KIND_ICON = {
  VISIT: "bi-geo-alt", SALE: "bi-cash-stack", ORDER: "bi-bag", INTERACTION: "bi-chat-dots",
};
const INTERACTION_KINDS = ["CALL", "EMAIL", "WHATSAPP", "MEETING", "EVENT", "GIFT", "SAMPLE", "GREETING", "NOTE"];
const RESPONSE_LABELS = {
  POSITIVE: "Positive", NEGATIVE: "Negative", NEUTRAL: "Neutral",
  INTERESTED: "Interested", NOT_INTERESTED: "Not interested", FOLLOW_UP_REQUIRED: "Follow-up",
};

const DoctorCrmPanel = ({ doctorId, doctor, onDoctorUpdate }) => {
  const { notify } = useNotify();
  const role = useSelector((state) => state.auth.user?.role);
  const canEdit = CRM_ROLES.includes(role);

  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(null);
  const [savingCrm, setSavingCrm] = useState(false);

  const [logForm, setLogForm] = useState({ kind: "CALL", summary: "", outcome: "", followUpDate: "" });
  const [logging, setLogging] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, timelineRes] = await Promise.all([
        doctorCrmApi.getSummary(doctorId),
        doctorCrmApi.getTimeline(doctorId),
      ]);
      setSummary(summaryRes);
      setTimeline(timelineRes.events || []);
    } catch (err) {
      notify(errorMessage(err, "Unable to load CRM data"), "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  useEffect(() => {
    if (!doctor) return;
    setForm({
      tier: doctor.tier || "UNGRADED",
      tags: (doctor.tags || []).join(", "),
      anniversaryDate: toInput(doctor.anniversaryDate),
      marketingConsent: !!doctor.marketingConsent,
      kyc: {
        registrationNumber: doctor.kyc?.registrationNumber || "",
        qualification: doctor.kyc?.qualification || "",
        hospitalAffiliation: doctor.kyc?.hospitalAffiliation || "",
        preferredContact: doctor.kyc?.preferredContact || "",
        preferredContactTime: doctor.kyc?.preferredContactTime || "",
      },
    });
  }, [doctor]);

  const saveCrm = async (event) => {
    event.preventDefault();
    setSavingCrm(true);
    try {
      const payload = {
        tier: form.tier,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        anniversaryDate: form.anniversaryDate || "",
        marketingConsent: form.marketingConsent,
        kyc: form.kyc,
      };
      const res = await doctorCrmApi.updateCrm(doctorId, payload);
      notify("Doctor CRM updated");
      onDoctorUpdate?.(res.doctor);
    } catch (err) {
      notify(errorMessage(err, "Unable to save"), "", "error");
    } finally {
      setSavingCrm(false);
    }
  };

  const submitLog = async (event) => {
    event.preventDefault();
    if (!logForm.summary.trim()) return;
    setLogging(true);
    try {
      await doctorCrmApi.createInteraction(doctorId, {
        kind: logForm.kind,
        summary: logForm.summary.trim(),
        outcome: logForm.outcome.trim() || undefined,
        followUpDate: logForm.followUpDate || undefined,
      });
      notify("Interaction logged");
      setLogForm({ kind: "CALL", summary: "", outcome: "", followUpDate: "" });
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to log interaction"), "", "error");
    } finally {
      setLogging(false);
    }
  };

  const removeInteraction = async (event) => {
    if (event.kind !== "INTERACTION") return;
    if (!window.confirm("Remove this logged interaction?")) return;
    try {
      await doctorCrmApi.deleteInteraction(doctorId, event.id);
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to remove"), "", "error");
    }
  };

  const responseChips = useMemo(
    () => (summary?.responseMix || []).map((row) => `${RESPONSE_LABELS[row.response] || row.response}: ${row.count}`),
    [summary]
  );

  return (
    <>
      {/* ENGAGEMENT SUMMARY */}
      <div className="col-12">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-activity text-primary me-2"></i>Engagement</h5>
            {loading || !summary ? (
              <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2"></span>Loading…</div>
            ) : (
              <>
                <div className="row g-3">
                  <Stat label="Completed visits" value={summary.totalVisits} />
                  <Stat label="Sales value" value={money(summary.salesValue)} />
                  <Stat label="Orders" value={summary.orderCount} />
                  <Stat label="Last activity" value={summary.daysSinceLastActivity === null ? "Never" : `${summary.daysSinceLastActivity}d ago`} />
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {responseChips.map((chip) => <span key={chip} className="badge text-bg-light border">{chip}</span>)}
                  {summary.nextFollowUp && (
                    <span className="badge text-bg-warning">
                      Follow-up {fmt(summary.nextFollowUp.followUpDate)}: {summary.nextFollowUp.summary}
                    </span>
                  )}
                  {summary.lastVisitBy && (
                    <span className="badge text-bg-light border">Last visit by {summary.lastVisitBy} · {fmt(summary.lastVisitAt)}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CRM DETAILS */}
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-clipboard-heart text-primary me-2"></i>CRM Details</h5>
            {!form ? null : !canEdit ? (
              <dl className="row small mb-0">
                <dt className="col-5 text-muted fw-normal">Tier</dt><dd className="col-7"><span className={`badge ${TIER_STYLE[form.tier]}`}>{form.tier}</span></dd>
                <dt className="col-5 text-muted fw-normal">Tags</dt><dd className="col-7">{form.tags || "—"}</dd>
                <dt className="col-5 text-muted fw-normal">Registration</dt><dd className="col-7">{form.kyc.registrationNumber || "—"}</dd>
                <dt className="col-5 text-muted fw-normal">Qualification</dt><dd className="col-7">{form.kyc.qualification || "—"}</dd>
                <dt className="col-5 text-muted fw-normal">Marketing consent</dt><dd className="col-7">{form.marketingConsent ? "Given" : "Not given"}</dd>
              </dl>
            ) : (
              <form onSubmit={saveCrm}>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Tier</label>
                    <select className="form-select form-select-sm" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                      <option value="A">A — top priority</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="UNGRADED">Ungraded</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Anniversary</label>
                    <input type="date" className="form-control form-control-sm" value={form.anniversaryDate} onChange={(e) => setForm({ ...form, anniversaryDate: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold mb-1">Tags (comma separated)</label>
                    <input className="form-control form-control-sm" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="KOL, high-prescriber" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Registration no.</label>
                    <input className="form-control form-control-sm" value={form.kyc.registrationNumber} onChange={(e) => setForm({ ...form, kyc: { ...form.kyc, registrationNumber: e.target.value } })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Qualification</label>
                    <input className="form-control form-control-sm" value={form.kyc.qualification} onChange={(e) => setForm({ ...form, kyc: { ...form.kyc, qualification: e.target.value } })} placeholder="MBBS, MD" />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold mb-1">Hospital / affiliation</label>
                    <input className="form-control form-control-sm" value={form.kyc.hospitalAffiliation} onChange={(e) => setForm({ ...form, kyc: { ...form.kyc, hospitalAffiliation: e.target.value } })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Preferred contact</label>
                    <select className="form-select form-select-sm" value={form.kyc.preferredContact} onChange={(e) => setForm({ ...form, kyc: { ...form.kyc, preferredContact: e.target.value } })}>
                      <option value="">—</option>
                      <option value="PHONE">Phone</option>
                      <option value="EMAIL">Email</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="IN_PERSON">In person</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Best time</label>
                    <input className="form-control form-control-sm" value={form.kyc.preferredContactTime} onChange={(e) => setForm({ ...form, kyc: { ...form.kyc, preferredContactTime: e.target.value } })} placeholder="After 6 PM" />
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="mkt-consent" checked={form.marketingConsent} onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })} />
                      <label className="form-check-label small" htmlFor="mkt-consent">Consents to marketing / educational material</label>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-sm btn-primary mt-3" disabled={savingCrm}>{savingCrm ? "Saving…" : "Save CRM"}</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* INTERACTION TIMELINE */}
      <div className="col-lg-7">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-clock-history text-primary me-2"></i>Interaction Timeline</h5>

            {canEdit && (
              <form className="border rounded-3 p-3 mb-3" onSubmit={submitLog}>
                <div className="row g-2 align-items-end">
                  <div className="col-4">
                    <label className="form-label small fw-semibold mb-1">Type</label>
                    <select className="form-select form-select-sm" value={logForm.kind} onChange={(e) => setLogForm({ ...logForm, kind: e.target.value })}>
                      {INTERACTION_KINDS.map((k) => <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div className="col-8">
                    <label className="form-label small fw-semibold mb-1">What happened</label>
                    <input required className="form-control form-control-sm" value={logForm.summary} onChange={(e) => setLogForm({ ...logForm, summary: e.target.value })} />
                  </div>
                  <div className="col-8">
                    <label className="form-label small fw-semibold mb-1">Outcome (optional)</label>
                    <input className="form-control form-control-sm" value={logForm.outcome} onChange={(e) => setLogForm({ ...logForm, outcome: e.target.value })} />
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold mb-1">Follow-up</label>
                    <input type="date" className="form-control form-control-sm" value={logForm.followUpDate} onChange={(e) => setLogForm({ ...logForm, followUpDate: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-sm btn-primary" disabled={logging}>{logging ? "Saving…" : "Log interaction"}</button>
                  </div>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2"></span>Loading…</div>
            ) : timeline.length === 0 ? (
              <p className="text-muted small mb-0">No activity recorded yet.</p>
            ) : (
              <ul className="list-unstyled mb-0" style={{ maxHeight: 420, overflowY: "auto" }}>
                {timeline.map((event) => (
                  <li key={`${event.kind}-${event.id}`} className="d-flex gap-3 py-2 border-bottom">
                    <i className={`bi ${KIND_ICON[event.kind] || "bi-dot"} text-muted mt-1`}></i>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between gap-2">
                        <span className="fw-semibold small">
                          {event.title}
                          {event.response && <span className="badge text-bg-light border ms-1">{RESPONSE_LABELS[event.response] || event.response}</span>}
                        </span>
                        <span className="text-muted small text-nowrap">{fmt(event.at)}</span>
                      </div>
                      {event.detail && <div className="text-muted small">{event.detail}</div>}
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                        {event.by ? `by ${event.by}` : ""}
                        {event.followUpDate ? ` · follow up ${fmt(event.followUpDate)}` : ""}
                        {canEdit && event.kind === "INTERACTION" && (
                          <button type="button" className="btn btn-link btn-sm p-0 ms-2 text-danger align-baseline" onClick={() => removeInteraction(event)}>remove</button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const Stat = ({ label, value }) => (
  <div className="col-6 col-lg-3">
    <div className="border rounded-3 p-2 text-center h-100">
      <div className="fw-bold">{value}</div>
      <div className="small text-muted">{label}</div>
    </div>
  </div>
);

export default DoctorCrmPanel;
