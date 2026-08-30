import { useEffect, useMemo, useState } from "react";
import visitApi from "../../api/visitApi";
import { PageContainer, PageHeader, StatCard, FilterBar, DataTable, EmptyState } from "../../components/ui";

const STATUS_VARIANT = {
  COMPLETED: "success", APPROVED: "success",
  CANCELLED: "danger", REJECTED: "danger",
  SCHEDULED: "info", IN_PROGRESS: "info",
};

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
        setError(err?.response?.data?.message || "Unable to load visits");
      } finally {
        setLoading(false);
      }
    };
    loadVisits();
  }, []);

  const getStartOfDay = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
  const getEndOfDay = (date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };

  const dateBounds = useMemo(() => {
    const now = new Date();
    if (dateRangeFilter === "today") return { start: getStartOfDay(now), end: getEndOfDay(now) };
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
      const employeeName = visit.employeeId?.name || visit.createdBy?.name || "";
      const employeeEmail = visit.employeeId?.email || visit.createdBy?.email || "";
      const doctorName = visit.doctorId?.name || "";
      const matchesSearch = !searchValue
        || employeeName.toLowerCase().includes(searchValue)
        || employeeEmail.toLowerCase().includes(searchValue)
        || doctorName.toLowerCase().includes(searchValue);
      const visitDate = visit.visitedAt ? new Date(visit.visitedAt) : null;
      const matchesDate = !dateBounds || (visitDate && visitDate >= dateBounds.start && visitDate <= dateBounds.end);
      const matchesAssigned = !assignedOnly || Boolean(visit.assignedBy);
      return matchesSearch && matchesDate && matchesAssigned;
    });
  }, [visits, search, dateBounds, assignedOnly]);

  const verifiedVisits = filteredVisits.filter((v) => v.locationVerified).length;
  const unverifiedVisits = filteredVisits.filter((v) => !v.locationVerified).length;
  const completedVisits = filteredVisits.filter((v) => v.status?.toUpperCase() === "COMPLETED").length;
  const hasFilters = search || dateRangeFilter !== "all" || assignedOnly;

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
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load visit photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  const formatStatus = (status) =>
    !status ? "—" : status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const dateCell = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return (
      <div>
        <div className="fw-semibold">{d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
        <small className="text-muted">{d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small>
      </div>
    );
  };

  const columns = [
    { key: "date", header: "Date", render: (v) => dateCell(v.visitedAt) },
    {
      key: "doctor",
      header: "Doctor",
      render: (v) => (
        <div>
          <div className="fw-semibold">{v.doctorId?.name || "—"}</div>
          {v.doctorId?.specialty && <small className="text-muted">{v.doctorId.specialty}</small>}
        </div>
      ),
    },
    {
      key: "employee",
      header: "Employee",
      render: (v) => {
        const employee = v.employeeId || v.createdBy;
        if (!employee) return "—";
        return (
          <div>
            <div className="fw-semibold">{employee.name || "—"}</div>
            {employee.email && <small className="text-muted">{employee.email}</small>}
          </div>
        );
      },
    },
    {
      key: "assignedBy",
      header: "Assigned By",
      render: (v) => v.assignedBy?.name
        ? <span className="mf-badge mf-badge--info"><i className="bi bi-person-check"></i> {v.assignedBy.name}</span>
        : <span className="text-muted small">Self-logged</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (v) => <span className={`mf-badge mf-badge--${STATUS_VARIANT[v.status?.toUpperCase()] || "warning"}`}>{formatStatus(v.status)}</span>,
    },
    {
      key: "location",
      header: "Location",
      render: (v) => v.locationVerified
        ? <span className="mf-badge mf-badge--success"><i className="bi bi-check-circle-fill"></i> Verified</span>
        : <span className="mf-badge mf-badge--warning"><i className="bi bi-x-circle-fill"></i> Not verified</span>,
    },
    {
      key: "photo",
      header: "Photo",
      render: (v) => v.visitPhoto?.storageName
        ? <button type="button" className="btn btn-sm btn-outline-primary rounded-3" disabled={photoLoading} onClick={() => viewPhoto(v)}><i className="bi bi-camera me-1"></i> View</button>
        : <span className="text-muted">—</span>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Field"
        title="MR Visit Records"
        description="Monitor employee field visits, doctors and location verification."
      />

      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-start gap-3 mb-0">
          <i className="bi bi-exclamation-triangle fs-5"></i>
          <div>
            <div className="fw-bold">Unable to load visits</div>
            <div className="small">{error}</div>
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-6 col-xl-3"><StatCard label="Total Visits" value={filteredVisits.length} icon="bi-clipboard-data" /></div>
        <div className="col-6 col-xl-3"><StatCard label="Location Verified" value={verifiedVisits} icon="bi-geo-alt-fill" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
        <div className="col-6 col-xl-3"><StatCard label="Not Verified" value={unverifiedVisits} icon="bi-geo-alt" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
        <div className="col-6 col-xl-3"><StatCard label="Completed" value={completedVisits} icon="bi-check2-circle" iconBg="var(--mf-color-info-subtle)" iconColor="var(--mf-color-info)" /></div>
      </div>

      <FilterBar>
        <FilterBar.Field grow>
          <div className="input-group input-group-sm">
            <span className="input-group-text"><i className="bi bi-search text-muted"></i></span>
            <input
              className="form-control"
              placeholder="Search employee name, email or doctor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </FilterBar.Field>
        <FilterBar.Field label="Date range" htmlFor="v-range">
          <select
            id="v-range"
            className="form-select form-select-sm"
            value={dateRangeFilter}
            onChange={(e) => { setDateRangeFilter(e.target.value); if (e.target.value !== "custom") setCustomDate(""); }}
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
            <option value="custom">Custom date</option>
          </select>
        </FilterBar.Field>
        {dateRangeFilter === "custom" && (
          <FilterBar.Field label="Pick date" htmlFor="v-date">
            <input id="v-date" type="date" className="form-control form-control-sm" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          </FilterBar.Field>
        )}
        <FilterBar.Field label="&nbsp;">
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="assignedOnlyCheck" checked={assignedOnly} onChange={(e) => setAssignedOnly(e.target.checked)} />
            <label className="form-check-label" htmlFor="assignedOnlyCheck">Assigned only</label>
          </div>
        </FilterBar.Field>
        {hasFilters && (
          <FilterBar.Actions>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}><i className="bi bi-x-circle me-1"></i> Clear</button>
          </FilterBar.Actions>
        )}
      </FilterBar>

      <DataTable
        columns={columns}
        rows={filteredVisits}
        pageSize={25}
        rowKey={(v) => v._id}
        loading={loading}
        mobileCards
        empty={
          <EmptyState
            icon="bi-clipboard-x"
            title="No visits found"
            description="No visit records match your current search or date filter."
            action={hasFilters && (
              <button type="button" className="btn btn-outline-primary rounded-3" onClick={clearFilters}>
                <i className="bi bi-arrow-clockwise me-2"></i> Clear filters
              </button>
            )}
          />
        }
      />
    </PageContainer>
  );
};

export default Visits;
