import { useEffect, useMemo, useState } from "react";
import visitApi from "../../api/visitApi";

const Visits = () => {
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [assignedOnly, setAssignedOnly] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await visitApi.listVisits();

        setVisits(response.visits || []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Unable to load visits"
        );
      } finally {
        setLoading(false);
      }
    };

    loadVisits();
  }, []);

  const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const dateBounds = useMemo(() => {
    const now = new Date();

    if (dateRangeFilter === "today") {
      return { start: getStartOfDay(now), end: getEndOfDay(now) };
    }

    if (dateRangeFilter === "week") {
      const weekStart = new Date(now);
      const day = weekStart.getDay();
      const diff = day === 0 ? 6 : day - 1;
      weekStart.setDate(weekStart.getDate() - diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { start: getStartOfDay(weekStart), end: getEndOfDay(weekEnd) };
    }

    if (dateRangeFilter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: getStartOfDay(start), end: getEndOfDay(end) };
    }

    if (dateRangeFilter === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { start: getStartOfDay(start), end: getEndOfDay(end) };
    }

    if (dateRangeFilter === "custom" && customDate) {
      const day = new Date(`${customDate}T00:00:00`);
      return { start: getStartOfDay(day), end: getEndOfDay(day) };
    }

    return null;
  }, [dateRangeFilter, customDate]);

  const filteredVisits = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return visits.filter((visit) => {
      const employeeName =
        visit.employeeId?.name ||
        visit.createdBy?.name ||
        "";

      const employeeEmail =
        visit.employeeId?.email ||
        visit.createdBy?.email ||
        "";

      const doctorName =
        visit.doctorId?.name || "";

      const matchesSearch =
        !searchValue ||
        employeeName.toLowerCase().includes(searchValue) ||
        employeeEmail.toLowerCase().includes(searchValue) ||
        doctorName.toLowerCase().includes(searchValue);

      const visitDate = visit.visitedAt ? new Date(visit.visitedAt) : null;
      const matchesDate =
        !dateBounds ||
        (visitDate && visitDate >= dateBounds.start && visitDate <= dateBounds.end);

      const matchesAssigned = !assignedOnly || Boolean(visit.assignedBy);

      return matchesSearch && matchesDate && matchesAssigned;
    });
  }, [visits, search, dateBounds, assignedOnly]);

  const verifiedVisits = filteredVisits.filter(
    (visit) => visit.locationVerified
  ).length;

  const unverifiedVisits = filteredVisits.filter(
    (visit) => !visit.locationVerified
  ).length;

  const completedVisits = filteredVisits.filter(
    (visit) =>
      visit.status?.toUpperCase() === "COMPLETED"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setDateRangeFilter("all");
    setCustomDate("");
    setAssignedOnly(false);
  };

  const viewPhoto = async (visit) => {
    try {
      setPhotoLoading(true);
      const blob = await visitApi.downloadVisitPhoto(visit._id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load visit photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "APPROVED":
        return "bg-success-subtle text-success";

      case "CANCELLED":
      case "REJECTED":
        return "bg-danger-subtle text-danger";

      case "SCHEDULED":
        return "bg-primary-subtle text-primary";

      case "IN_PROGRESS":
        return "bg-primary-subtle text-primary";

      default:
        return "bg-warning-subtle text-warning-emphasis";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "APPROVED":
        return "bi-check-circle-fill";

      case "CANCELLED":
      case "REJECTED":
        return "bi-x-circle-fill";

      case "SCHEDULED":
        return "bi-calendar-event";

      case "IN_PROGRESS":
        return "bi-arrow-repeat";

      default:
        return "bi-clock-fill";
    }
  };

  return (
    <div className="visits-page min-vh-100 bg-light py-4 py-md-5">
      <div className="container-fluid px-3 px-md-4">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                <i className="bi bi-clipboard-check me-1"></i>
                Visit Management
              </span>
            </div>

            <h2 className="fw-bold mb-1">
              Visits
            </h2>

            <p className="text-muted mb-0">
              Monitor employee field visits, doctors and
              location verification.
            </p>
          </div>

          <div className="visit-date-card">
            <div className="visit-date-icon">
              <i className="bi bi-calendar3"></i>
            </div>

            <div>
              <small className="text-muted d-block">
                Today
              </small>

              <strong>
                {new Date().toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </strong>
            </div>
          </div>

        </div>

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4 mb-4">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center"
                style={{
                  width: 42,
                  height: 42,
                }}
              >
                <i className="bi bi-exclamation-triangle"></i>
              </div>

              <div>
                <div className="fw-bold">
                  Unable to load visits
                </div>

                <div className="small">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-3 mb-4">

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-icon bg-primary-subtle text-primary">
                <i className="bi bi-clipboard-data"></i>
              </div>

              <div>
                <small>Total Visits</small>
                <h3>{filteredVisits.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-icon bg-success-subtle text-success">
                <i className="bi bi-geo-alt-fill"></i>
              </div>

              <div>
                <small>Location Verified</small>
                <h3>{verifiedVisits}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-icon bg-warning-subtle text-warning-emphasis">
                <i className="bi bi-geo-alt"></i>
              </div>

              <div>
                <small>Not Verified</small>
                <h3>{unverifiedVisits}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-icon bg-info-subtle text-info">
                <i className="bi bi-check2-circle"></i>
              </div>

              <div>
                <small>Completed</small>
                <h3>{completedVisits}</h3>
              </div>
            </div>
          </div>

        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-3 p-md-4">

            <div className="d-flex align-items-center gap-3 mb-3">

              <div className="section-icon bg-primary-subtle text-primary">
                <i className="bi bi-funnel"></i>
              </div>

              <div>
                <h5 className="fw-bold mb-1">
                  Search & Filter
                </h5>

                <p className="text-muted small mb-0">
                  Search visits by employee, email or doctor.
                </p>
              </div>

            </div>

            <div className="row g-3">

              <div className="col-lg-6">

                <label className="form-label fw-semibold">
                  Search
                </label>

                <div className="input-group">

                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search employee name, email or doctor name..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />

                </div>

              </div>

              <div className="col-lg-3">

                <label className="form-label fw-semibold">
                  Date Range
                </label>

                <select
                  className="form-select"
                  value={dateRangeFilter}
                  onChange={(e) => {
                    setDateRangeFilter(e.target.value);
                    if (e.target.value !== "custom") setCustomDate("");
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Date</option>
                </select>

              </div>

              {dateRangeFilter === "custom" && (
                <div className="col-lg-3">
                  <label className="form-label fw-semibold">
                    Pick Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                </div>
              )}

              <div className="col-lg-2 d-flex align-items-end">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="assignedOnlyCheck"
                    checked={assignedOnly}
                    onChange={(e) => setAssignedOnly(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="assignedOnlyCheck">
                    Assigned only
                  </label>
                </div>
              </div>

              <div className="col-lg-2 d-flex align-items-end">

                <button
                  type="button"
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

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

          <div className="card-header bg-white border-0 p-4">

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

              <div className="d-flex align-items-center gap-3">

                <div className="section-icon bg-success-subtle text-success">
                  <i className="bi bi-list-check"></i>
                </div>

                <div>
                  <h5 className="fw-bold mb-1">
                    Visit Records
                  </h5>

                  <p className="text-muted small mb-0">
                    Showing {filteredVisits.length} visit
                    {filteredVisits.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>

              </div>

              {(search || dateRangeFilter !== "all" || assignedOnly) && (
                <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                  Filters Applied
                </span>
              )}

            </div>

          </div>

          {loading ? (

            <div className="py-5 text-center">

              <div
                className="spinner-border text-primary mb-3"
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                }}
              ></div>

              <h6 className="fw-semibold">
                Loading visits...
              </h6>

              <p className="text-muted small mb-0">
                Please wait while we fetch visit records.
              </p>

            </div>

          ) : filteredVisits.length === 0 ? (

            <div className="text-center py-5 px-4">

              <div className="empty-icon mx-auto mb-3">
                <i className="bi bi-clipboard-x"></i>
              </div>

              <h5 className="fw-bold">
                No visits found
              </h5>

              <p className="text-muted mb-3">
                No visit records match your current
                search or date filter.
              </p>

              {(search || dateRangeFilter !== "all" || assignedOnly) && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={clearFilters}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Clear Filters
                </button>
              )}

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table align-middle mb-0 visits-table">

                <thead>
                  <tr>
                    <th className="ps-4">
                      Date
                    </th>

                    <th>
                      Doctor
                    </th>

                    <th>
                      Employee
                    </th>

                    <th>
                      Assigned By
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Photo
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredVisits.map((visit) => {

                    const employee =
                      visit.employeeId ||
                      visit.createdBy;

                    return (
                      <tr key={visit._id}>

                        <td className="ps-4">

                          <div className="d-flex align-items-center gap-3">

                            <div className="date-icon">
                              <i className="bi bi-calendar-event"></i>
                            </div>

                            <div>

                              <div className="fw-semibold">
                                {visit.visitedAt
                                  ? new Date(
                                      visit.visitedAt
                                    ).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      }
                                    )
                                  : "-"}
                              </div>

                              <small className="text-muted">
                                {visit.visitedAt
                                  ? new Date(
                                      visit.visitedAt
                                    ).toLocaleTimeString(
                                      "en-IN",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : ""}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <div className="d-flex align-items-center gap-2">

                            <div className="doctor-avatar">
                              <i className="bi bi-person-badge"></i>
                            </div>

                            <div>

                              <div className="fw-semibold">
                                {visit.doctorId?.name ||
                                  "-"}
                              </div>

                              {visit.doctorId?.specialty && (
                                <small className="text-muted">
                                  {
                                    visit.doctorId
                                      .specialty
                                  }
                                </small>
                              )}

                            </div>

                          </div>

                        </td>

                        <td>

                          {employee ? (

                            <div className="d-flex align-items-center gap-2">

                              <div className="user-avatar">
                                {(
                                  employee.name ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <div className="fw-semibold">
                                  {employee.name ||
                                    "-"}
                                </div>

                                {employee.email && (
                                  <small className="text-muted">
                                    {employee.email}
                                  </small>
                                )}

                              </div>

                            </div>

                          ) : (
                            "-"
                          )}

                        </td>

                        <td>
                          {visit.assignedBy?.name ? (
                            <span className="badge bg-info-subtle text-info-emphasis rounded-pill px-3 py-2">
                              <i className="bi bi-person-check me-1"></i>
                              {visit.assignedBy.name}
                            </span>
                          ) : (
                            <span className="text-muted small">Self-logged</span>
                          )}
                        </td>

                        <td>

                          <span
                            className={`status-badge ${getStatusClass(
                              visit.status
                            )}`}
                          >

                            <i
                              className={`bi ${getStatusIcon(
                                visit.status
                              )}`}
                            ></i>

                            {formatStatus(
                              visit.status
                            )}

                          </span>

                        </td>

                        <td>

                          {visit.locationVerified ? (

                            <span className="location-badge verified">
                              <i className="bi bi-check-circle-fill"></i>
                              Verified
                            </span>

                          ) : (

                            <span className="location-badge not-verified">
                              <i className="bi bi-x-circle-fill"></i>
                              Not Verified
                            </span>

                          )}

                        </td>

                        <td>
                          {visit.visitPhoto?.storageName ? <button type="button" className="btn btn-sm btn-outline-primary" disabled={photoLoading} onClick={() => viewPhoto(visit)}><i className="bi bi-camera me-1"></i>View</button> : <span className="text-muted">-</span>}
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

      <style>{`

        .visits-page {
          color: #212529;
        }

        .visit-date-card {
          background: #fff;
          border: 1px solid #edf0f4;
          border-radius: 14px;
          padding: 10px 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
        }

        .visit-date-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #eef4ff;
          color: #0d6efd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid #edf0f4;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
          transition: all 0.25s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.07);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .stat-card small {
          color: #6c757d;
          display: block;
          margin-bottom: 2px;
        }

        .stat-card h3 {
          margin: 0;
          font-weight: 700;
        }

        .section-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .visits-table thead th {
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding-top: 15px;
          padding-bottom: 15px;
          white-space: nowrap;
        }

        .visits-table tbody td {
          padding-top: 18px;
          padding-bottom: 18px;
          border-color: #f0f2f5;
        }

        .visits-table tbody tr {
          transition: background 0.2s ease;
        }

        .visits-table tbody tr:hover {
          background: #fafbff;
        }

        .date-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 11px;
          background: #eef4ff;
          color: #0d6efd;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doctor-avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 11px;
          background: #f0eaff;
          color: #6f42c1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 50%;
          background: #e9ecef;
          color: #495057;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .status-badge,
        .location-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 50px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .location-badge.verified {
          background: #eafaf1;
          color: #198754;
        }

        .location-badge.not-verified {
          background: #fff4e5;
          color: #fd7e14;
        }

        .empty-icon {
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: #f1f3f5;
          color: #6c757d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }

        @media (max-width: 767px) {

          .visits-page {
            padding-top: 20px !important;
          }

          .visit-date-card {
            width: 100%;
          }

          /* Needs to out-specificity styles/ui-system.css's
             .table-responsive > .table min-width rule (0,2,0),
             otherwise this override is silently ignored. */
          .table-responsive > .table.visits-table {
            min-width: 950px;
          }

        }

      `}</style>
    </div>
  );
};

export default Visits;