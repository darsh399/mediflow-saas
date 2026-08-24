import { useEffect, useMemo, useState } from "react";
import leaveApi from "../../api/leaveApi";

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await leaveApi.listLeaves();

      setLeaves(response.leaves || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load leave requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEmployeeName = (leave) => {
    return (
      leave.userId?.name ||
      leave.user?.name ||
      leave.employeeId?.name ||
      "Unknown Employee"
    );
  };

  const getEmployeeEmail = (leave) => {
    return (
      leave.userId?.email ||
      leave.user?.email ||
      leave.employeeId?.email ||
      ""
    );
  };

  const filteredLeaves = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return leaves.filter((leave) => {
      const employeeName =
        getEmployeeName(leave).toLowerCase();

      const employeeEmail =
        getEmployeeEmail(leave).toLowerCase();

      const leaveType = String(
        leave.leaveType || leave.type || ""
      ).toLowerCase();

      const reason = String(
        leave.reason || ""
      ).toLowerCase();

      const status = String(
        leave.status || "pending"
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeEmail.includes(searchValue) ||
        leaveType.includes(searchValue) ||
        reason.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      let matchesDate = true;

      if (dateFilter !== "all") {
        const days = Number(dateFilter);

        const startDate = new Date();

        startDate.setDate(
          startDate.getDate() - days
        );

        const leaveDate = new Date(
          leave.fromDate ||
            leave.startDate ||
            leave.createdAt
        );

        matchesDate = leaveDate >= startDate;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    leaves,
    search,
    statusFilter,
    dateFilter,
  ]);

  const review = async (id, action) => {
    try {
      setReviewingId(id);
      setError("");
      setSuccess("");

      await leaveApi.reviewLeave(id, action);

      setSuccess(
        `Leave ${
          action === "approve"
            ? "approved"
            : action === "reject"
            ? "rejected"
            : "cancelled"
        } successfully.`
      );

      await loadLeaves();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to update leave"
      );
    } finally {
      setReviewingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const pending = leaves.filter(
    (leave) =>
      String(leave.status).toLowerCase() === "pending"
  ).length;

  const approved = leaves.filter(
    (leave) =>
      String(leave.status).toLowerCase() === "approved"
  ).length;

  const rejected = leaves.filter(
    (leave) =>
      String(leave.status).toLowerCase() === "rejected"
  ).length;

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

  if (loading) {
    return (
      <div
        className="container-fluid py-4"
        style={{
          backgroundColor: "#f8f9fc",
          minHeight: "100vh",
        }}
      >
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div
              className="spinner-border text-primary mb-3"
              style={{
                width: "3rem",
                height: "3rem",
              }}
            ></div>

            <h5 className="fw-semibold">
              Loading Leave Requests
            </h5>

            <p className="text-muted mb-0">
              Please wait while we fetch company leaves...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="col-lg-7">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "55px",
                      height: "55px",
                    }}
                  >
                    <i className="bi bi-calendar2-check fs-3"></i>
                  </div>

                  <div>
                    <span className="small opacity-75">
                      HR OPERATIONS
                    </span>

                    <h2 className="fw-bold mb-0">
                      Leave Management
                    </h2>
                  </div>
                </div>

                <p className="mb-0 opacity-75">
                  Review and manage leave requests from your
                  team.
                </p>
              </div>

              <div className="col-lg-5 mt-4 mt-lg-0">
                <div className="row g-3">
                  <div className="col-4">
                    <div className="bg-white bg-opacity-10 rounded-4 p-3 text-center">
                      <div className="fs-3 fw-bold">
                        {pending}
                      </div>

                      <small className="opacity-75">
                        Pending
                      </small>
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="bg-white bg-opacity-10 rounded-4 p-3 text-center">
                      <div className="fs-3 fw-bold">
                        {approved}
                      </div>

                      <small className="opacity-75">
                        Approved
                      </small>
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="bg-white bg-opacity-10 rounded-4 p-3 text-center">
                      <div className="fs-3 fw-bold">
                        {rejected}
                      </div>

                      <small className="opacity-75">
                        Rejected
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS */}
        {success && (
          <div className="alert alert-success border-0 shadow-sm rounded-4">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </div>
        )}

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* FILTERS */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">

              <div className="col-lg-5">
                <label className="form-label fw-semibold">
                  Search Employee
                </label>

                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-primary"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee name or email..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="col-lg-3">
                <label className="form-label fw-semibold">
                  Status
                </label>

                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="all">
                    All Status
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              <div className="col-lg-2">
                <label className="form-label fw-semibold">
                  Date
                </label>

                <select
                  className="form-select"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(e.target.value)
                  }
                >
                  <option value="all">
                    All Time
                  </option>

                  <option value="30">
                    Last 30 Days
                  </option>

                  <option value="60">
                    Last 60 Days
                  </option>
                </select>
              </div>

              <div className="col-lg-2">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={clearFilters}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Clear
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1">
                  Leave Requests
                </h5>

                <p className="text-muted small mb-0">
                  Showing {filteredLeaves.length} of{" "}
                  {leaves.length} requests
                </p>
              </div>

              <span className="badge bg-primary rounded-pill px-3 py-2">
                {pending} Pending
              </span>
            </div>
          </div>

          {filteredLeaves.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x text-primary fs-1"></i>

              <h5 className="fw-bold mt-3">
                No Leave Requests Found
              </h5>

              <p className="text-muted">
                No leave requests match your filters.
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
                      #
                    </th>

                    <th className="py-3 border-0">
                      EMPLOYEE
                    </th>

                    <th className="py-3 border-0">
                      LEAVE TYPE
                    </th>

                    <th className="py-3 border-0">
                      DATES
                    </th>

                    <th className="py-3 border-0">
                      REASON
                    </th>

                    <th className="py-3 border-0">
                      STATUS
                    </th>

                    <th className="py-3 border-0 pe-4">
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeaves.map(
                    (leave, index) => {
                      const statusStyle =
                        getStatusStyle(
                          leave.status
                        );

                      const isPending =
                        String(
                          leave.status
                        ).toLowerCase() ===
                        "pending";

                      return (
                        <tr key={leave._id}>
                          <td className="px-4 py-4">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center fw-semibold"
                              style={{
                                width: "38px",
                                height: "38px",
                                backgroundColor:
                                  "#f1f5f9",
                              }}
                            >
                              {index + 1}
                            </div>
                          </td>

                          <td className="py-4">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                  width: "45px",
                                  height: "45px",
                                  background:
                                    "linear-gradient(135deg, #e7f1ff, #ede7ff)",
                                  color: "#0d6efd",
                                }}
                              >
                                <i className="bi bi-person-fill fs-5"></i>
                              </div>

                              <div>
                                <div className="fw-bold">
                                  {getEmployeeName(
                                    leave
                                  )}
                                </div>

                                <small className="text-muted">
                                  {getEmployeeEmail(
                                    leave
                                  )}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td className="py-4">
                            <span className="fw-semibold">
                              {leave.leaveType ||
                                leave.type ||
                                "-"}
                            </span>
                          </td>

                          <td className="py-4">
                            <div className="fw-semibold">
                              {formatDate(
                                leave.fromDate ||
                                  leave.startDate
                              )}
                            </div>

                            <small className="text-muted">
                              to{" "}
                              {formatDate(
                                leave.toDate ||
                                  leave.endDate
                              )}
                            </small>
                          </td>

                          <td className="py-4">
                            <div
                              className="text-muted small"
                              style={{
                                maxWidth: "220px",
                              }}
                            >
                              {leave.reason || "-"}
                            </div>
                          </td>

                          <td className="py-4">
                            <span
                              className="badge rounded-pill px-3 py-2"
                              style={{
                                backgroundColor:
                                  statusStyle.backgroundColor,
                                color:
                                  statusStyle.color,
                              }}
                            >
                              <i
                                className={`bi ${statusStyle.icon} me-1`}
                              ></i>

                              {leave.status ||
                                "Pending"}
                            </span>
                          </td>

                          <td className="py-4 pe-4">
                            {isPending ? (
                              <div className="d-flex flex-column flex-xl-row gap-2">
                                <button
                                  className="btn btn-success btn-sm rounded-3"
                                  disabled={
                                    reviewingId ===
                                    leave._id
                                  }
                                  onClick={() =>
                                    review(
                                      leave._id,
                                      "approve"
                                    )
                                  }
                                >
                                  {reviewingId ===
                                  leave._id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <>
                                      <i className="bi bi-check-lg me-1"></i>
                                      Approve
                                    </>
                                  )}
                                </button>

                                <button
                                  className="btn btn-outline-danger btn-sm rounded-3"
                                  disabled={
                                    reviewingId ===
                                    leave._id
                                  }
                                  onClick={() =>
                                    review(
                                      leave._id,
                                      "reject"
                                    )
                                  }
                                >
                                  <i className="bi bi-x-lg me-1"></i>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted small">
                                Already reviewed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LeaveManagement; 