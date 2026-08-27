import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApprovals } from "../../hooks/useApprovals";
import { useNotify } from "../../components/NotificationProvider";
import leaveApi from "../../api/leaveApi";
import expenseApi from "../../api/expenseApi";
import salaryApi from "../../api/salaryApi";

const formatDate = (date) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatAmount = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const personName = (person) => person?.name || person?.email || "Unknown";

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const SECTION_META = {
  leaves: { icon: "bi-calendar2-week", label: "Leave requests", accent: "#fd7e14" },
  expenses: { icon: "bi-receipt", label: "Expense claims", accent: "#0dcaf0" },
  onboarding: { icon: "bi-person-vcard", label: "Onboarding profiles", accent: "#6610f2" },
  offers: { icon: "bi-file-earmark-text", label: "Offer letters", accent: "#198754" },
};

const ApprovalsInbox = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const { groups, counts, total, loading, error, refresh, capabilities } = useApprovals();
  const [busyId, setBusyId] = useState(null);

  const runAction = async (id, work, { success, failure }) => {
    try {
      setBusyId(id);
      await work();
      notify(success);
      await refresh();
    } catch (err) {
      notify(errorMessage(err, failure), "", "error");
    } finally {
      setBusyId(null);
    }
  };

  const reviewLeave = (leave, action) => {
    const note = window.prompt(
      action === "reject" ? "Reason for rejection:" : "Approval comment (optional):",
      ""
    );
    if (note === null) return;
    if (action === "reject" && !note.trim()) return;
    runAction(leave._id, () => leaveApi.reviewLeave(leave._id, { action, reviewNote: note.trim() }), {
      success: `Leave ${action === "approve" ? "approved" : "rejected"}`,
      failure: "Unable to update leave",
    });
  };

  const reviewExpense = (expense, action) => {
    const note = window.prompt(
      action === "reject" ? "Reason for rejection:" : "Approval comment (optional):",
      ""
    );
    if (note === null) return;
    if (action === "reject" && !note.trim()) return;
    runAction(
      expense._id,
      () => expenseApi.reviewExpense(expense._id, { action, reviewNote: note.trim() }),
      {
        success: `Expense ${action === "approve" ? "approved" : "rejected"}`,
        failure: "Unable to update expense",
      }
    );
  };

  const sendOffer = (offer) =>
    runAction(offer._id, () => salaryApi.sendOffer(offer._id), {
      success: "Offer letter sent",
      failure: "Unable to send offer",
    });

  const anySource =
    capabilities.leaves || capabilities.expenses || capabilities.onboarding || capabilities.offers;

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        {/* HEADER */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div
            className="card-body p-4 p-lg-5 text-white"
            style={{ background: "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)" }}
          >
            <div className="row align-items-center">
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: "55px", height: "55px" }}
                  >
                    <i className="bi bi-inbox-fill fs-3"></i>
                  </div>
                  <div>
                    <span className="small opacity-75">MY APPROVALS</span>
                    <h2 className="fw-bold mb-0">Approvals Inbox</h2>
                  </div>
                </div>
                <p className="mb-0 opacity-75">
                  Everything waiting on your review, in one place.
                </p>
              </div>
              <div className="col-lg-4 mt-4 mt-lg-0">
                <div className="bg-white bg-opacity-10 rounded-4 p-4 text-center">
                  <div className="display-6 fw-bold">{loading ? "…" : total}</div>
                  <small className="opacity-75">Pending your action</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* SUMMARY TILES */}
        <div className="row g-3 mb-4">
          {Object.keys(SECTION_META)
            .filter((key) => capabilities[key])
            .map((key) => {
              const meta = SECTION_META[key];
              return (
                <div className="col-6 col-xl-3" key={key}>
                  <a
                    href={`#section-${key}`}
                    className="card border-0 shadow-sm rounded-4 h-100 text-decoration-none"
                  >
                    <div className="card-body d-flex align-items-center gap-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "44px", height: "44px", background: `${meta.accent}1a`, color: meta.accent }}
                      >
                        <i className={`bi ${meta.icon} fs-5`}></i>
                      </div>
                      <div>
                        <div className="fs-4 fw-bold text-dark">{counts[key]}</div>
                        <div className="small text-muted">{meta.label}</div>
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
        </div>

        {loading && (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
              <h5 className="fw-semibold">Loading your approvals</h5>
            </div>
          </div>
        )}

        {!loading && !anySource && (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <i className="bi bi-shield-lock text-primary fs-1"></i>
              <h5 className="fw-bold mt-3">No approval permissions</h5>
              <p className="text-muted mb-0">Your role doesn't review any requests.</p>
            </div>
          </div>
        )}

        {!loading && anySource && total === 0 && (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <i className="bi bi-check2-circle text-success fs-1"></i>
              <h5 className="fw-bold mt-3">You're all caught up</h5>
              <p className="text-muted mb-0">Nothing is waiting on your review right now.</p>
            </div>
          </div>
        )}

        {/* LEAVES */}
        {!loading && counts.leaves > 0 && (
          <Section id="section-leaves" meta={SECTION_META.leaves} count={counts.leaves}>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Employee</th>
                    <th className="py-3 border-0">Type</th>
                    <th className="py-3 border-0">Dates</th>
                    <th className="py-3 border-0">Reason</th>
                    <th className="py-3 border-0 pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.leaves.map((leave) => {
                    const person = leave.userId || leave.user || leave.employeeId;
                    return (
                      <tr key={leave._id}>
                        <td className="px-4 py-3">
                          <div className="fw-semibold">{personName(person)}</div>
                          <small className="text-muted">{person?.email || ""}</small>
                        </td>
                        <td className="py-3">{leave.leaveType || leave.type || "-"}</td>
                        <td className="py-3">
                          <div className="fw-semibold">{formatDate(leave.fromDate || leave.startDate)}</div>
                          <small className="text-muted">to {formatDate(leave.toDate || leave.endDate)}</small>
                        </td>
                        <td className="py-3">
                          <div className="text-muted small" style={{ maxWidth: "220px" }}>
                            {leave.reason || "-"}
                          </div>
                        </td>
                        <td className="py-3 pe-4">
                          <RowActions
                            busy={busyId === leave._id}
                            onApprove={() => reviewLeave(leave, "approve")}
                            onReject={() => reviewLeave(leave, "reject")}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* EXPENSES */}
        {!loading && counts.expenses > 0 && (
          <Section id="section-expenses" meta={SECTION_META.expenses} count={counts.expenses}>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Employee</th>
                    <th className="py-3 border-0">Category</th>
                    <th className="py-3 border-0">Amount</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0 pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.expenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className="px-4 py-3">
                        <div className="fw-semibold">{personName(expense.employeeId)}</div>
                        <small className="text-muted">{expense.employeeId?.email || ""}</small>
                      </td>
                      <td className="py-3 text-capitalize">
                        {String(expense.category || "-").toLowerCase().replace(/_/g, " ")}
                      </td>
                      <td className="py-3 fw-semibold">{formatAmount(expense.amount)}</td>
                      <td className="py-3">{formatDate(expense.expenseDate || expense.createdAt)}</td>
                      <td className="py-3 pe-4">
                        <RowActions
                          busy={busyId === expense._id}
                          onApprove={() => reviewExpense(expense, "approve")}
                          onReject={() => reviewExpense(expense, "reject")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ONBOARDING */}
        {!loading && counts.onboarding > 0 && (
          <Section id="section-onboarding" meta={SECTION_META.onboarding} count={counts.onboarding}>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Employee</th>
                    <th className="py-3 border-0">Role</th>
                    <th className="py-3 border-0">Completion</th>
                    <th className="py-3 border-0 pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.onboarding.map((profile) => (
                    <tr key={profile._id}>
                      <td className="px-4 py-3">
                        <div className="fw-semibold">{personName(profile.userId)}</div>
                        <small className="text-muted">{profile.userId?.email || ""}</small>
                      </td>
                      <td className="py-3 text-capitalize">
                        {String(profile.userId?.role || "-").replace(/_/g, " ")}
                      </td>
                      <td className="py-3" style={{ minWidth: "120px" }}>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${profile.completion?.percentage || 0}%` }}
                          />
                        </div>
                        <small className="text-muted">{profile.completion?.percentage || 0}%</small>
                      </td>
                      <td className="py-3 pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary rounded-3"
                          onClick={() => navigate(`/employee/profiles/${profile._id}`)}
                        >
                          <i className="bi bi-eye me-1"></i>Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* OFFERS */}
        {!loading && counts.offers > 0 && (
          <Section id="section-offers" meta={SECTION_META.offers} count={counts.offers}>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Candidate</th>
                    <th className="py-3 border-0">Job title</th>
                    <th className="py-3 border-0">Drafted</th>
                    <th className="py-3 border-0 pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.offers.map((offer) => (
                    <tr key={offer._id}>
                      <td className="px-4 py-3 fw-semibold">{personName(offer.employeeId)}</td>
                      <td className="py-3">{offer.jobTitle || "-"}</td>
                      <td className="py-3">{formatDate(offer.createdAt)}</td>
                      <td className="py-3 pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-3 me-2"
                          onClick={() => navigate("/offers")}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-success rounded-3"
                          disabled={busyId === offer._id}
                          onClick={() => sendOffer(offer)}
                        >
                          {busyId === offer._id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            <>
                              <i className="bi bi-send me-1"></i>Send
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

      </div>
    </div>
  );
};

const Section = ({ id, meta, count, children }) => (
  <div id={id} className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
    <div className="card-header bg-white border-0 p-4 d-flex align-items-center gap-3">
      <div
        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: "40px", height: "40px", background: `${meta.accent}1a`, color: meta.accent }}
      >
        <i className={`bi ${meta.icon}`}></i>
      </div>
      <div>
        <h5 className="fw-bold mb-0">{meta.label}</h5>
        <small className="text-muted">{count} pending</small>
      </div>
    </div>
    {children}
  </div>
);

const RowActions = ({ busy, onApprove, onReject }) => (
  <div className="d-flex justify-content-end gap-2">
    <button
      type="button"
      className="btn btn-success btn-sm rounded-3"
      disabled={busy}
      onClick={onApprove}
    >
      {busy ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-lg me-1"></i>Approve</>}
    </button>
    <button
      type="button"
      className="btn btn-outline-danger btn-sm rounded-3"
      disabled={busy}
      onClick={onReject}
    >
      <i className="bi bi-x-lg me-1"></i>Reject
    </button>
  </div>
);

export default ApprovalsInbox;
