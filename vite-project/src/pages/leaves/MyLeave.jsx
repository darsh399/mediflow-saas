import { useEffect, useMemo, useState } from "react";
import leaveApi from "../../api/leaveApi";

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await leaveApi.listMyLeaves();

      setLeaves(response.leaves || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load leave history"
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

  const filteredLeaves = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const now = new Date();

    return leaves.filter((leave) => {
      const type = String(
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
        type.includes(searchValue) ||
        reason.includes(searchValue) ||
        status.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      let matchesDate = true;

      const leaveDate = new Date(
        leave.fromDate ||
          leave.startDate ||
          leave.createdAt
      );

      if (dateFilter === "30") {
        const date = new Date(now);
        date.setDate(date.getDate() - 30);

        matchesDate = leaveDate >= date;
      }

      if (dateFilter === "60") {
        const date = new Date(now);
        date.setDate(date.getDate() - 60);

        matchesDate = leaveDate >= date;
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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const showHistory = async (leaveId) => {
    try {
      setHistoryLoading(true);
      const response = await leaveApi.getLeaveHistory(leaveId);
      setHistory(response);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load leave history");
    } finally {
      setHistoryLoading(false);
    }
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
              Loading Leave History
            </h5>

            <p className="text-muted mb-0">
              Please wait while we fetch your leaves...
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
                "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)",
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
                    <i className="bi bi-calendar-check fs-3"></i>
                  </div>

                  <div>
                    <span className="small opacity-75">
                      LEAVE MANAGEMENT
                    </span>

                    <h2 className="fw-bold mb-0">
                      My Leaves
                    </h2>
                  </div>
                </div>

                <p className="mb-0 opacity-75">
                  View and track your complete leave history.
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

        {/* ERROR */}
        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {history && <div className="card border-0 shadow-sm rounded-4 mb-4"><div className="card-body p-4"><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">Leave Action History</h5><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setHistory(null)}>Close</button></div><div className="mb-3"><strong>{history.leave?.leaveType || history.leave?.type}</strong><span className="text-muted ms-2">{formatDate(history.leave?.fromDate || history.leave?.startDate)} to {formatDate(history.leave?.toDate || history.leave?.endDate)}</span></div>{historyLoading ? <div className="text-muted">Loading history...</div> : history.history?.length ? <div className="border-start border-primary ps-3">{history.history.map(item => <div className="mb-3" key={item._id}><div className="fw-semibold">{item.action}</div><div className="small text-muted">{formatDate(item.createdAt)} by {item.actorName} ({String(item.actorRole || '').replace(/_/g, ' ')})</div>{item.comment && <div className="small mt-1">{item.comment}</div>}</div>)}</div> : <div className="text-muted">No action history available.</div>}</div></div>}

        {/* FILTERS */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">

              <div className="col-lg-5">
                <label className="form-label fw-semibold">
                  Search
                </label>

                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-primary"></i>
                  </span>

                  <input
                    className="form-control"
                    placeholder="Search leave type, reason or status..."
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
            <h5 className="fw-bold mb-1">
              Leave History
            </h5>

            <p className="text-muted small mb-0">
              Showing {filteredLeaves.length} of{" "}
              {leaves.length} applications
            </p>
          </div>

          {filteredLeaves.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x text-primary fs-1"></i>

              <h5 className="fw-bold mt-3">
                No Leaves Found
              </h5>

              <p className="text-muted">
                No leave applications match your filters.
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
                      LEAVE TYPE
                    </th>

                    <th className="py-3 border-0">
                      FROM
                    </th>

                    <th className="py-3 border-0">
                      TO
                    </th>

                    <th className="py-3 border-0">
                      REASON
                    </th>

                    <th className="py-3 border-0">
                      STATUS
                    </th>

                    <th className="py-3 border-0">HISTORY</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeaves.map(
                    (leave, index) => {
                      const statusStyle =
                        getStatusStyle(
                          leave.status
                        );

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
                            <span className="fw-bold">
                              {leave.leaveType ||
                                leave.type ||
                                "-"}
                            </span>
                          </td>

                          <td className="py-4"><button type="button" className="btn btn-sm btn-outline-primary" disabled={historyLoading} onClick={() => showHistory(leave._id)}>View</button></td>

                          <td className="py-4">
                            {formatDate(
                              leave.fromDate ||
                                leave.startDate
                            )}
                          </td>

                          <td className="py-4">
                            {formatDate(
                              leave.toDate ||
                                leave.endDate
                            )}
                          </td>

                          <td className="py-4">
                            <span className="text-muted small">
                              {leave.reason || "-"}
                            </span>
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

export default MyLeaves;
