import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllMyVisits } from "../../redux/slices/userSlice";

const MyVisits = () => {
  const dispatch = useDispatch();

  const { items: visits, loading, error } = useSelector(
    (state) => state.users
  );

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    dispatch(getAllMyVisits());
  }, [dispatch]);

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const filteredVisits = useMemo(() => {
    if (!visits) return [];

    const now = new Date();

    let startDate = null;
    let endDate = null;

    if (dateFilter === "today") {
      startDate = getStartOfDay(now);
      endDate = getEndOfDay(now);
    }

    if (dateFilter === "week") {
      const weekStart = new Date(now);
      const day = weekStart.getDay();

      const diff = day === 0 ? 6 : day - 1;

      weekStart.setDate(weekStart.getDate() - diff);

      startDate = getStartOfDay(weekStart);
      endDate = getEndOfDay(now);
    }

    if (dateFilter === "30") {
      const date = new Date(now);
      date.setDate(date.getDate() - 30);

      startDate = getStartOfDay(date);
      endDate = getEndOfDay(now);
    }

    if (dateFilter === "60") {
      const date = new Date(now);
      date.setDate(date.getDate() - 60);

      startDate = getStartOfDay(date);
      endDate = getEndOfDay(now);
    }

    if (dateFilter === "custom") {
      if (fromDate) {
        startDate = getStartOfDay(new Date(`${fromDate}T00:00:00`));
      }

      if (toDate) {
        endDate = getEndOfDay(new Date(`${toDate}T00:00:00`));
      }
    }

    const searchValue = search.trim().toLowerCase();

    return visits.filter((visit) => {
      const doctorName =
        visit.doctorId?.name?.toLowerCase() || "";

      const medicalName =
        visit.medicalId?.name?.toLowerCase() || "";

      const specialty =
        visit.doctorId?.specialization?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        doctorName.includes(searchValue) ||
        medicalName.includes(searchValue) ||
        specialty.includes(searchValue);

      const visitDate = visit.createdAt
        ? new Date(visit.createdAt)
        : null;

      let matchesDate = true;

      if (visitDate && startDate) {
        matchesDate = visitDate >= startDate;
      }

      if (visitDate && endDate && matchesDate) {
        matchesDate = visitDate <= endDate;
      }

      return matchesSearch && matchesDate;
    });
  }, [
    visits,
    search,
    dateFilter,
    fromDate,
    toDate,
  ]);

  const clearFilters = () => {
    setSearch("");
    setDateFilter("all");
    setFromDate("");
    setToDate("");
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body py-5 text-center">
            <div
              className="spinner-border text-primary mb-3"
              style={{
                width: "3rem",
                height: "3rem",
              }}
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            <h5 className="fw-semibold mb-1">
              Loading Visit History
            </h5>

            <p className="text-muted mb-0">
              Please wait while we fetch your visits...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <div className="alert alert-danger border-0 rounded-3 mb-0 d-flex align-items-start gap-3">
              <div
                className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "45px",
                  height: "45px",
                }}
              >
                <i className="bi bi-exclamation-triangle fs-5"></i>
              </div>

              <div>
                <h6 className="fw-bold mb-1">
                  Unable to load visits
                </h6>

                <p className="mb-0 small">
                  {error?.message ||
                    "Something went wrong while loading your visits."}
                </p>
              </div>
            </div>
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
                    <i className="bi bi-clipboard2-pulse fs-3"></i>
                  </div>

                  <div>
                    <span className="small opacity-75">
                      ACTIVITY OVERVIEW
                    </span>

                    <h2 className="fw-bold mb-0">
                      My Visits
                    </h2>
                  </div>
                </div>

                <p className="mb-0 opacity-75">
                  View and track all doctor visits completed by you.
                </p>
              </div>

              <div className="col-lg-4 mt-4 mt-lg-0">
                <div className="row g-3 justify-content-lg-end">
                  <div className="col-6 col-lg-auto">
                    <div
                      className="bg-white bg-opacity-10 rounded-4 p-3 text-center"
                      style={{
                        minWidth: "125px",
                      }}
                    >
                      <div className="fs-2 fw-bold">
                        {filteredVisits.length}
                      </div>

                      <div className="small opacity-75">
                        Showing
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-lg-auto">
                    <div
                      className="bg-white bg-opacity-10 rounded-4 p-3 text-center"
                      style={{
                        minWidth: "125px",
                      }}
                    >
                      <div className="fs-2 fw-bold">
                        <i className="bi bi-check-circle"></i>
                      </div>

                      <div className="small opacity-75">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">

            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">

              <div className="flex-grow-1">
                <label className="form-label fw-semibold">
                  Search Visits
                </label>

                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-primary"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search doctor, medical or specialty..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ minWidth: "220px" }}>
                <label className="form-label fw-semibold">
                  Date Range
                </label>

                <select
                  className="form-select"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);

                    if (e.target.value !== "custom") {
                      setFromDate("");
                      setToDate("");
                    }
                  }}
                >
                  <option value="all">
                    All Visits
                  </option>

                  <option value="today">
                    Today
                  </option>

                  <option value="week">
                    This Week
                  </option>

                  <option value="30">
                    Last 30 Days
                  </option>

                  <option value="60">
                    Last 60 Days
                  </option>

                  <option value="custom">
                    Custom Range
                  </option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear
              </button>

            </div>

            {dateFilter === "custom" && (
              <div className="row g-3 mt-2">

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    From Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) =>
                      setFromDate(e.target.value)
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    To Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) =>
                      setToDate(e.target.value)
                    }
                  />
                </div>

              </div>
            )}

            <div className="d-flex flex-wrap align-items-center gap-2 mt-3">

              <span className="text-muted small">
                Showing
              </span>

              <span className="badge bg-primary rounded-pill px-3 py-2">
                {filteredVisits.length}
              </span>

              <span className="text-muted small">
                of {visits?.length || 0} visits
              </span>

              {search && (
                <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                  Search: {search}
                </span>
              )}

              {dateFilter !== "all" && (
                <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                  {dateFilter === "today"
                    ? "Today"
                    : dateFilter === "week"
                    ? "This Week"
                    : dateFilter === "30"
                    ? "Last 30 Days"
                    : dateFilter === "60"
                    ? "Last 60 Days"
                    : "Custom Range"}
                </span>
              )}

            </div>

          </div>
        </div>

        {!filteredVisits || filteredVisits.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5 px-4">

              <div
                className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "90px",
                  height: "90px",
                  background:
                    "linear-gradient(135deg, rgba(13,110,253,.1), rgba(102,16,242,.1))",
                }}
              >
                <i className="bi bi-clipboard2-x text-primary fs-1"></i>
              </div>

              <h4 className="fw-bold mb-2">
                No Visits Found
              </h4>

              <p
                className="text-muted mx-auto mb-3"
                style={{
                  maxWidth: "450px",
                }}
              >
                No visits match your current search or date filters.
              </p>

              {(search || dateFilter !== "all") && (
                <button
                  className="btn btn-primary rounded-3"
                  onClick={clearFilters}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Clear Filters
                </button>
              )}

            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

            <div className="card-header bg-white border-0 p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

                <div>
                  <h5 className="fw-bold mb-1">
                    Visit History
                  </h5>

                  <p className="text-muted small mb-0">
                    Your completed doctor and medical visits
                  </p>
                </div>

                <div
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                  style={{
                    backgroundColor: "#f0f6ff",
                    color: "#0d6efd",
                  }}
                >
                  <i className="bi bi-calendar-check"></i>

                  <span className="fw-semibold small">
                    {filteredVisits.length}{" "}
                    {filteredVisits.length === 1
                      ? "Visit"
                      : "Visits"}
                  </span>
                </div>

              </div>
            </div>

            <div className="card-body p-0">

              <div className="table-responsive">

                <table className="table align-middle mb-0">

                  <thead
                    style={{
                      backgroundColor: "#f8f9fc",
                    }}
                  >
                    <tr>
                      <th
                        className="border-0 px-4 py-3 text-muted small fw-semibold"
                        style={{
                          minWidth: "60px",
                        }}
                      >
                        #
                      </th>

                      <th className="border-0 py-3 text-muted small fw-semibold">
                        DOCTOR
                      </th>

                      <th className="border-0 py-3 text-muted small fw-semibold">
                        MEDICAL
                      </th>

                      <th className="border-0 py-3 text-muted small fw-semibold">
                        VISIT DATE
                      </th>

                      <th className="border-0 py-3 text-muted small fw-semibold">
                        LOCATION
                      </th>

                      <th className="border-0 py-3 text-muted small fw-semibold">
                        STATUS
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVisits.map((visit, index) => (
                      <tr key={visit._id}>

                        <td className="px-4 py-4">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center fw-semibold"
                            style={{
                              width: "38px",
                              height: "38px",
                              backgroundColor: "#f1f5f9",
                              color: "#64748b",
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
                              }}
                            >
                              <i className="bi bi-person-vcard text-primary fs-5"></i>
                            </div>

                            <div>
                              <div className="fw-bold text-dark">
                                {visit.doctorId?.name || "N/A"}
                              </div>

                              {visit.doctorId?.specialization ? (
                                <small className="text-muted">
                                  {visit.doctorId.specialization}
                                </small>
                              ) : (
                                <small className="text-muted">
                                  Doctor
                                </small>
                              )}
                            </div>

                          </div>
                        </td>

                        <td className="py-4">
                          <div className="d-flex align-items-center gap-2">

                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center"
                              style={{
                                width: "36px",
                                height: "36px",
                                backgroundColor: "#eafaf1",
                                color: "#198754",
                              }}
                            >
                              <i className="bi bi-capsule"></i>
                            </div>

                            <span className="fw-semibold">
                              {visit.medicalId?.name || "N/A"}
                            </span>

                          </div>
                        </td>

                        <td className="py-4">
                          <div className="fw-semibold text-dark">
                            {formatDate(visit.createdAt)}
                          </div>

                          <small className="text-muted">
                            {formatTime(visit.createdAt)}
                          </small>
                        </td>

                        <td className="py-4">
                          {visit.location?.latitude &&
                          visit.location?.longitude ? (
                            <div>

                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-geo-alt-fill text-danger"></i>

                                <span className="fw-semibold small">
                                  Location Verified
                                </span>
                              </div>

                              <small
                                className="text-muted"
                                title={`${visit.location.latitude}, ${visit.location.longitude}`}
                              >
                                {Number(
                                  visit.location.latitude
                                ).toFixed(4)}
                                ,{" "}
                                {Number(
                                  visit.location.longitude
                                ).toFixed(4)}
                              </small>

                            </div>
                          ) : (
                            <span className="text-muted small">
                              <i className="bi bi-geo-alt me-1"></i>
                              Not available
                            </span>
                          )}
                        </td>

                        <td className="py-4">
                          <span
                            className="badge rounded-pill px-3 py-2"
                            style={{
                              backgroundColor: "#e8f8ef",
                              color: "#198754",
                            }}
                          >
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Completed
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>

              </div>

            </div>
          </div>
        )}

        <div className="row g-3 mt-4">

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "45px",
                      height: "45px",
                      backgroundColor: "#e7f1ff",
                    }}
                  >
                    <i className="bi bi-clipboard-check text-primary fs-5"></i>
                  </div>

                  <div>
                    <div className="text-muted small">
                      Total Visits
                    </div>

                    <div className="fs-4 fw-bold">
                      {filteredVisits.length}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "45px",
                      height: "45px",
                      backgroundColor: "#eafaf1",
                    }}
                  >
                    <i className="bi bi-check-circle text-success fs-5"></i>
                  </div>

                  <div>
                    <div className="text-muted small">
                      Completed Visits
                    </div>

                    <div className="fs-4 fw-bold">
                      {filteredVisits.length}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "45px",
                      height: "45px",
                      backgroundColor: "#fff4e5",
                    }}
                  >
                    <i className="bi bi-geo-alt text-warning fs-5"></i>
                  </div>

                  <div>
                    <div className="text-muted small">
                      Location Tracking
                    </div>

                    <div className="fs-6 fw-bold text-success">
                      Enabled
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MyVisits;