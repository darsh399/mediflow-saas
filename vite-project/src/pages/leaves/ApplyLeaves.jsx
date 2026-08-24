import { useEffect, useState } from "react";
import leaveApi from "../../api/leaveApi";

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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLeaves = async () => {
    try {
      setLoadingLeaves(true);

      const response = await leaveApi.listMyLeaves();

      setLeaves(response.leaves || []);
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

  const calculateDays = () => {
    if (!form.fromDate || !form.toDate) return 0;

    const from = new Date(`${form.fromDate}T00:00:00`);
    const to = new Date(`${form.toDate}T00:00:00`);

    if (to < from) return 0;

    const difference =
      Math.floor(
        (to.getTime() - from.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    return difference;
  };

  const days = calculateDays();

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
    <div
      className="container-fluid py-4"
      style={{
        backgroundColor: "#f8f9fc",
        minHeight: "100vh",
      }}
    >
      <div className="container-fluid px-0">

        {/* HEADER */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div
            className="card-body p-4 p-lg-5 text-white"
            style={{
              background:
                "linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)",
            }}
          >
            <div className="row align-items-center">
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "55px",
                      height: "55px",
                    }}
                  >
                    <i className="bi bi-calendar-plus fs-3"></i>
                  </div>

                  <div>
                    <span className="small opacity-75">
                      LEAVE MANAGEMENT
                    </span>

                    <h2 className="fw-bold mb-0">
                      Apply Leave
                    </h2>
                  </div>
                </div>

                <p className="mb-0 opacity-75">
                  Submit a leave request and track your leave
                  application history.
                </p>
              </div>

              <div className="col-lg-4 mt-4 mt-lg-0">
                <div className="row g-3">
                  <div className="col-6">
                    <div
                      className="bg-white bg-opacity-10 rounded-4 p-3 text-center"
                    >
                      <div className="fs-2 fw-bold">
                        {pendingCount}
                      </div>

                      <div className="small opacity-75">
                        Pending
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div
                      className="bg-white bg-opacity-10 rounded-4 p-3 text-center"
                    >
                      <div className="fs-2 fw-bold">
                        {approvedCount}
                      </div>

                      <div className="small opacity-75">
                        Approved
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  backgroundColor: "#e7f1ff",
                  color: "#0d6efd",
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
                    <option value="CASUAL">
                      Casual Leave
                    </option>

                    <option value="SICK">
                      Sick Leave
                    </option>

                    <option value="EARNED">
                      Earned Leave
                    </option>

                    <option value="PAID">
                      Paid Leave
                    </option>

                    <option value="UNPAID">
                      Unpaid Leave
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
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
                        color: "#0d6efd",
                      }}
                    >
                      <i className="bi bi-calendar3 fs-5"></i>
                    </div>

                    <div>
                      <div className="text-muted small">
                        Leave Duration
                      </div>

                      <div className="fw-bold">
                        {days > 0
                          ? `${days} ${
                              days === 1
                                ? "Day"
                                : "Days"
                            }`
                          : "Select dates"}
                      </div>
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
                    Reference document <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
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
                    backgroundColor: "#f8f9fc",
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
    </div>
  );
};

export default ApplyLeave;
