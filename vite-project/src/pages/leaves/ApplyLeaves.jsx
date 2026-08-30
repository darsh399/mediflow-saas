import { useEffect, useState } from "react";
import leaveApi from "../../api/leaveApi";
import calendarApi from "../../api/calendarApi";
import { workingDaysBetween } from "../../utils/calendarDates";
import { PageContainer, PageHeader, StatCard } from "../../components/ui";

const ApplyLeave = () => {
  const [form, setForm] = useState({
    leaveType: "CASUAL",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [documentFile, setDocumentFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [workingWeek, setWorkingWeek] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLeaves = async () => {
    try {
      setLoadingLeaves(true);

      const [response, policyResponse, balanceResponse] = await Promise.all([leaveApi.listMyLeaves(), leaveApi.getPolicy(), leaveApi.getMyBalances()]);
      setLeaves(response.leaves || []);
      setLeaveTypes((policyResponse.policy?.leaveTypes || []).filter(type => type.enabled));
      setBalances(balanceResponse.balances || []);
      const configuredTypes = (policyResponse.policy?.leaveTypes || []).filter(type => type.enabled);
      if (configuredTypes.length && !configuredTypes.some(type => type.code === form.leaveType)) setForm(current => ({ ...current, leaveType: configuredTypes[0].code }));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load leave history"
      );
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  useEffect(() => {
    // The calendar module may be disabled for the company — fall back silently
    // to a plain calendar-day count if these can't be loaded.
    Promise.allSettled([calendarApi.listHolidays(), calendarApi.getSettings()]).then(
      ([holidayResult, settingsResult]) => {
        if (holidayResult.status === "fulfilled") setHolidays(holidayResult.value.holidays || []);
        if (settingsResult.status === "fulfilled") setWorkingWeek(settingsResult.value.weeklyWorkingDays || []);
      }
    );
  }, []);

  const companyHolidays = holidays.filter((holiday) => holiday.type === "COMPANY");

  const todayKey = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = holidays
    .filter((holiday) => String(holiday.endDate || holiday.date || "").slice(0, 10) >= todayKey)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 6);

  const calendarSpan = (() => {
    if (!form.fromDate || !form.toDate) return 0;
    const from = new Date(`${form.fromDate}T00:00:00`);
    const to = new Date(`${form.toDate}T00:00:00`);
    if (to < from) return 0;
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const days = form.fromDate && form.toDate && calendarSpan > 0
    ? workingDaysBetween(form.fromDate, form.toDate, workingWeek, companyHolidays)
    : 0;
  const excludedDays = calendarSpan > 0 ? calendarSpan - days : 0;
  const selectedPolicy = leaveTypes.find(type => type.code === form.leaveType);

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.fromDate || !form.toDate) {
      setError("Please select from and to dates.");
      return;
    }

    if (new Date(form.toDate) < new Date(form.fromDate)) {
      setError("To date cannot be before from date.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please provide a reason for leave.");
      return;
    }

    if (calendarSpan > 0 && days < 1) {
      setError("The selected dates fall entirely on weekly offs or company holidays.");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("leaveType", form.leaveType);
      payload.append("fromDate", form.fromDate);
      payload.append("toDate", form.toDate);
      payload.append("reason", form.reason.trim());
      if (documentFile) payload.append("document", documentFile);
      await leaveApi.applyLeave(payload);

      setMessage(
        "Leave application submitted successfully."
      );

      setForm({
        leaveType: "CASUAL",
        fromDate: "",
        toDate: "",
        reason: "",
      });
      setDocumentFile(null);

      await loadLeaves();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to apply leave"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    switch (String(status).toLowerCase()) {
      case "approved":
        return {
          backgroundColor: "#e8f8ef",
          color: "#198754",
          icon: "bi-check-circle-fill",
        };

      case "rejected":
        return {
          backgroundColor: "#fdecec",
          color: "#dc3545",
          icon: "bi-x-circle-fill",
        };

      case "cancelled":
        return {
          backgroundColor: "#f1f3f5",
          color: "#6c757d",
          icon: "bi-dash-circle-fill",
        };

      default:
        return {
          backgroundColor: "#fff4e5",
          color: "#fd7e14",
          icon: "bi-clock-fill",
        };
    }
  };

  const pendingCount = leaves.filter(
    (leave) =>
      String(leave.status).toLowerCase() === "pending"
  ).length;

  const approvedCount = leaves.filter(
    (leave) =>
      String(leave.status).toLowerCase() === "approved"
  ).length;

  return (
    <PageContainer>
      <PageHeader eyebrow="Leave" title="Apply Leave" description="Submit a leave request and track your leave application history." />

      <div className="row g-3">
        <div className="col-6 col-md-3"><StatCard label="Pending" value={pendingCount} icon="bi-hourglass-split" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
        <div className="col-6 col-md-3"><StatCard label="Approved" value={approvedCount} icon="bi-check2-circle" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
      </div>

      <div className="container-fluid px-0">

        {/* ALERTS */}
        {message && (
          <div className="alert alert-success border-0 shadow-sm rounded-4 d-flex align-items-center gap-3">
            <i className="bi bi-check-circle-fill fs-4"></i>

            <div>
              <strong>Success</strong>
              <div className="small">{message}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4 d-flex align-items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill fs-4"></i>

            <div>
              <strong>Unable to process request</strong>
              <div className="small">{error}</div>
            </div>
          </div>
        )}

        {/* FORM */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-0 p-4">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: "45px",
                  height: "45px",
                  backgroundColor: "var(--mf-color-primary-subtle)",
                  color: "var(--mf-color-primary)",
                }}
              >
                <i className="bi bi-pencil-square fs-5"></i>
              </div>

              <div>
                <h5 className="fw-bold mb-1">
                  New Leave Request
                </h5>

                <p className="text-muted small mb-0">
                  Fill in the details below to apply for leave.
                </p>
              </div>
            </div>
          </div>

          <div className="card-body p-4">
            <form onSubmit={submit}>
              <div className="row g-4">

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Leave Type
                  </label>

                  <select
                    className="form-select"
                    value={form.leaveType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        leaveType: e.target.value,
                      })
                    }
                    required
                  >
                    {leaveTypes.map(type => <option value={type.code} key={type._id}>{type.name}</option>)}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">
                    From Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={form.fromDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fromDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">
                    To Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={form.toDate}
                    min={form.fromDate || undefined}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        toDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-12">
                  <div
                    className="rounded-4 p-3 d-flex align-items-center gap-3"
                    style={{
                      backgroundColor: "#f0f6ff",
                    }}
                  >
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "45px",
                        height: "45px",
                        backgroundColor: "#dbeafe",
                        color: "var(--mf-color-primary)",
                      }}
                    >
                      <i className="bi bi-calendar3 fs-5"></i>
                    </div>

                    <div>
                      <div className="text-muted small">
                        Leave Duration
                      </div>

                      <div className="fw-bold">
                        {calendarSpan > 0
                          ? `${days} working ${days === 1 ? "day" : "days"}`
                          : "Select dates"}
                      </div>

                      {excludedDays > 0 && (
                        <div className="small text-muted">
                          {excludedDays} {excludedDays === 1 ? "day" : "days"} not charged
                          (weekly offs / company holidays) · {calendarSpan}-day span
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Reason
                  </label>

                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Enter reason for leave..."
                    value={form.reason}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        reason: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Reference document <span className="text-muted fw-normal">({selectedPolicy?.documentRequired ? "required" : "optional"})</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    required={Boolean(selectedPolicy?.documentRequired)}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                  <div className="form-text">Upload a PDF or image up to 5 MB, for example a medical certificate.</div>
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Leave Request
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">My Leave Balance</h5>
            <div className="row g-3">{balances.length ? balances.map(balance => <div className="col-sm-6 col-lg-4" key={balance._id}><div className="border rounded p-3"><div className="fw-semibold">{leaveTypes.find(type => type.code === balance.leaveTypeCode)?.name || balance.leaveTypeCode}</div><div className="small text-muted mt-2">Available: {balance.available} · Pending: {balance.pending} · Used: {balance.used}</div></div></div>) : <div className="col-12 text-muted">No leave balances configured.</div>}</div>
          </div>
        </div>

        {upcomingHolidays.length > 0 && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-1">Upcoming Company Holidays</h5>
              <p className="text-muted small mb-3">These days are not deducted from your leave balance.</p>
              <div className="row g-3">
                {upcomingHolidays.map((holiday) => (
                  <div className="col-sm-6 col-lg-4" key={holiday._id}>
                    <div className="border rounded p-3 h-100">
                      <div className="d-flex justify-content-between gap-2">
                        <span className="fw-semibold">{holiday.name}</span>
                        <span className={`badge rounded-pill ${holiday.type === "OPTIONAL" ? "text-bg-warning" : "text-bg-danger"}`}>
                          {holiday.type === "OPTIONAL" ? "Optional" : "Company"}
                        </span>
                      </div>
                      <div className="small text-muted mt-2">
                        <i className="bi bi-calendar3 me-1"></i>
                        {formatDate(holiday.date)}
                        {holiday.endDate ? ` – ${formatDate(holiday.endDate)}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RECENT LEAVES */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 p-4">
            <h5 className="fw-bold mb-1">
              Recent Leave Applications
            </h5>

            <p className="text-muted small mb-0">
              Track the status of your submitted leave requests.
            </p>
          </div>

          {loadingLeaves ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x text-muted fs-1"></i>

              <h5 className="fw-bold mt-3">
                No Leave Applications
              </h5>

              <p className="text-muted mb-0">
                You haven't submitted any leave requests yet.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead
                  style={{
                    backgroundColor: "var(--mf-surface-2)",
                  }}
                >
                  <tr>
                    <th className="px-4 py-3 border-0">
                      Leave Type
                    </th>

                    <th className="py-3 border-0">
                      From
                    </th>

                    <th className="py-3 border-0">
                      To
                    </th>

                    <th className="py-3 border-0">
                      Reason
                    </th>

                    <th className="py-3 border-0">
                      Status
                    </th>
                    <th className="py-3 border-0">Document</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => {
                    const statusStyle =
                      getStatusStyle(leave.status);

                    return (
                      <tr key={leave._id}>
                        <td className="px-4 py-4">
                          <span className="fw-semibold">
                            {leave.leaveType ||
                              leave.type ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            leave.fromDate ||
                              leave.startDate
                          )}
                        </td>

                        <td>
                          {formatDate(
                            leave.toDate ||
                              leave.endDate
                          )}
                        </td>

                        <td>
                          <span className="text-muted small">
                            {leave.reason || "-"}
                          </span>
                        </td>

                        <td>
                          <span
                            className="badge rounded-pill px-3 py-2"
                            style={{
                              backgroundColor:
                                statusStyle.backgroundColor,
                              color: statusStyle.color,
                            }}
                          >
                            <i
                              className={`bi ${statusStyle.icon} me-1`}
                            ></i>

                            {leave.status || "Pending"}
                          </span>
                        </td>
                        <td>
                          {leave.document?.url ? (
                            <a className="btn btn-sm btn-outline-primary" href={leave.document.url} target="_blank" rel="noreferrer">
                              <i className="bi bi-paperclip me-1"></i>View
                            </a>
                          ) : <span className="text-muted small">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
};

export default ApplyLeave;
