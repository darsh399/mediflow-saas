import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

import organizationApi from "../../api/organizationApi";
import { PageContainer, PageHeader, StatCard } from "../../components/ui";

const PRIVILEGED_VIEWERS = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];

const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const roleLabel = (role) => String(role || "").replace(/_/g, " ");

const statusOf = (employee) => {
  if (employee.active === false) return { label: "Inactive", cls: "is-inactive" };
  if (employee.employeeStatus && employee.employeeStatus !== "active")
    return { label: roleLabel(employee.employeeStatus), cls: "is-pending" };
  return { label: "Active", cls: "is-active" };
};

// Flat employee list -> single tree. Company owner is the root; anyone without a
// resolvable manager is placed under the owner. Falls back to a forest.
function buildTree(employees, ownerId) {
  const byId = new Map(employees.map((employee) => [String(employee._id), employee]));
  const childrenOf = new Map();
  const looseRoots = [];

  for (const employee of employees) {
    const id = String(employee._id);
    const managerId = employee.reportingManagerId ? String(employee.reportingManagerId) : null;
    if (managerId && byId.has(managerId) && managerId !== id) {
      if (!childrenOf.has(managerId)) childrenOf.set(managerId, []);
      childrenOf.get(managerId).push(employee);
    } else {
      looseRoots.push(employee);
    }
  }

  const sortByName = (list) => [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const ownerKey = ownerId ? String(ownerId) : null;
  let roots;
  if (ownerKey && byId.has(ownerKey)) {
    const ownerChildren = childrenOf.get(ownerKey) || [];
    const merged = [...ownerChildren];
    const seen = new Set(ownerChildren.map((child) => String(child._id)));
    for (const loose of looseRoots) {
      if (String(loose._id) === ownerKey) continue;
      if (seen.has(String(loose._id))) continue;
      merged.push(loose);
      seen.add(String(loose._id));
    }
    childrenOf.set(ownerKey, merged);
    roots = [byId.get(ownerKey)];
  } else {
    roots = sortByName(looseRoots);
  }

  const parentOf = new Map();
  for (const [managerId, kids] of childrenOf) {
    for (const kid of kids) parentOf.set(String(kid._id), managerId);
  }

  return { roots, childrenOf, byId, parentOf, sortByName };
}

const Node = ({
  employee,
  childrenOf,
  sortByName,
  collapsed,
  onToggle,
  selectedId,
  onSelect,
  dim,
  matchedIds,
  seen,
}) => {
  const id = String(employee._id);
  const reports = seen.has(id) ? [] : sortByName(childrenOf.get(id) || []);
  const nextSeen = new Set(seen).add(id);
  const isCollapsed = collapsed.has(id);
  const status = statusOf(employee);
  const dimmed = dim && !matchedIds.has(id);

  return (
    <li>
      <div className="org-node-head">
        <div
          id={`org-person-${id}`}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(id);
            }
          }}
          className={`org-card${dimmed ? " org-card--dim" : ""}${selectedId === id ? " org-card--active" : ""}`}
        >
          <div className="org-avatar">{initials(employee.name)}</div>
          <div className="org-name">{employee.name}</div>
          <div className="org-role">{employee.designation || roleLabel(employee.role)}</div>
          {employee.department && <div className="org-dept">{employee.department}</div>}
          <span className={`org-status ${status.cls}`}>{status.label}</span>
        </div>
        {reports.length > 0 && (
          <button
            type="button"
            className="org-toggle"
            onClick={() => onToggle(id)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expand reports" : "Collapse reports"}
          >
            {isCollapsed ? `+${reports.length}` : "−"}
          </button>
        )}
      </div>

      {!isCollapsed && reports.length > 0 && (
        <ul>
          {reports.map((report) => (
            <Node
              key={String(report._id)}
              employee={report}
              childrenOf={childrenOf}
              sortByName={sortByName}
              collapsed={collapsed}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              dim={dim}
              matchedIds={matchedIds}
              seen={nextSeen}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const OrgChart = () => {
  const [data, setData] = useState({ employees: [], companyOwnerId: null, companyName: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const viewerRole = useSelector((state) => state.auth.user?.role);
  const canOpenProfile = PRIVILEGED_VIEWERS.includes(viewerRole);

  const viewportRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);

  const selectedId = searchParams.get("focus") || "";
  const setSelectedId = (id) => {
    setSearchParams(id ? { focus: id } : {}, { replace: true });
  };

  useEffect(() => {
    organizationApi
      .getOrgChart()
      .then((response) =>
        setData({
          employees: response.employees || [],
          companyOwnerId: response.companyOwnerId || null,
          companyName: response.companyName || null,
        })
      )
      .catch((err) => setError(err?.response?.data?.message || "Unable to load the organization chart"))
      .finally(() => setLoading(false));
  }, []);

  const { roots, childrenOf, byId, parentOf, sortByName } = useMemo(
    () => buildTree(data.employees, data.companyOwnerId),
    [data.employees, data.companyOwnerId]
  );

  const query = search.trim().toLowerCase();
  const filtersActive =
    Boolean(query) || Boolean(roleFilter) || Boolean(deptFilter) || statusFilter !== "all";

  const roleOptions = useMemo(
    () => [...new Set(data.employees.map((e) => e.role).filter(Boolean))].sort(),
    [data.employees]
  );
  const deptOptions = useMemo(
    () => [...new Set(data.employees.map((e) => e.department).filter(Boolean))].sort(),
    [data.employees]
  );

  const matchedIds = useMemo(() => {
    const set = new Set();
    for (const employee of data.employees) {
      const okSearch =
        !query ||
        (employee.name || "").toLowerCase().includes(query) ||
        roleLabel(employee.role).toLowerCase().includes(query) ||
        (employee.designation || "").toLowerCase().includes(query) ||
        (employee.department || "").toLowerCase().includes(query) ||
        (employee.email || "").toLowerCase().includes(query);
      const okRole = !roleFilter || employee.role === roleFilter;
      const okDept = !deptFilter || employee.department === deptFilter;
      const okStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? employee.active !== false : employee.active === false);
      if (okSearch && okRole && okDept && okStatus) set.add(String(employee._id));
    }
    return set;
  }, [data.employees, query, roleFilter, deptFilter, statusFilter]);

  useEffect(() => {
    if (!filtersActive) return;
    setCollapsed((prev) => {
      if (!prev.size) return prev;
      const next = new Set(prev);
      for (const id of matchedIds) {
        let parent = parentOf.get(id);
        while (parent) {
          next.delete(parent);
          parent = parentOf.get(parent);
        }
      }
      return next.size === prev.size ? prev : next;
    });
  }, [filtersActive, matchedIds, parentOf]);

  const managerCount = useMemo(
    () =>
      new Set(
        data.employees.filter((e) => e.reportingManagerId).map((e) => String(e.reportingManagerId))
      ).size,
    [data.employees]
  );
  const unassignedCount = data.employees.filter((e) => !e.reportingManagerId).length;

  useEffect(() => {
    if (!selectedId || loading) return;
    const node = document.getElementById(`org-person-${selectedId}`);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }, [selectedId, loading]);

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    const ids = new Set();
    for (const [managerId, kids] of childrenOf) if (kids.length) ids.add(managerId);
    for (const root of roots) ids.delete(String(root._id));
    setCollapsed(ids);
  };

  const clampZoom = (value) => Math.min(2, Math.max(0.4, value));
  const zoomIn = () => setZoom((z) => clampZoom(z * 1.15));
  const zoomOut = () => setZoom((z) => clampZoom(z / 1.15));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const fitView = () => {
    const box = viewportRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;
    const next = clampZoom(Math.min(1, (box.clientWidth - 32) / (stage.scrollWidth || 1)));
    setZoom(next);
    setPan({ x: 0, y: 0 });
  };

  const onMouseDown = (event) => {
    if (event.button === 2) return;
    dragRef.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
  };
  const onMouseMove = (event) => {
    if (!dragRef.current) return;
    setPan({ x: event.clientX - dragRef.current.x, y: event.clientY - dragRef.current.y });
  };
  const endMouse = () => {
    dragRef.current = null;
  };

  const touchDistance = (touches) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const onTouchStart = (event) => {
    if (event.touches.length === 2) {
      pinchRef.current = { distance: touchDistance(event.touches), zoom };
    } else if (event.touches.length === 1) {
      dragRef.current = {
        x: event.touches[0].clientX - pan.x,
        y: event.touches[0].clientY - pan.y,
      };
    }
  };
  const onTouchMove = (event) => {
    if (event.touches.length === 2 && pinchRef.current) {
      const ratio = touchDistance(event.touches) / (pinchRef.current.distance || 1);
      setZoom(clampZoom(pinchRef.current.zoom * ratio));
    } else if (event.touches.length === 1 && dragRef.current) {
      setPan({
        x: event.touches[0].clientX - dragRef.current.x,
        y: event.touches[0].clientY - dragRef.current.y,
      });
    }
  };
  const endTouch = (event) => {
    if (event.touches.length === 0) {
      dragRef.current = null;
      pinchRef.current = null;
    }
  };

  const onSearchKeyDown = (event) => {
    if (event.key === "Enter" && matchedIds.size) {
      setSelectedId([...matchedIds][0]);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setDeptFilter("");
    setStatusFilter("all");
  };

  const selected = selectedId ? byId.get(String(selectedId)) : null;
  const selectedManager = selected?.reportingManagerId
    ? byId.get(String(selected.reportingManagerId))
    : null;
  const selectedReports = selected ? sortByName(childrenOf.get(String(selected._id)) || []) : [];
  const selectedStatus = selected ? statusOf(selected) : null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Company"
        title="Organization Chart"
        description={
          data.companyName
            ? `${data.companyName} — reporting structure`
            : "Reporting structure across the company."
        }
      />

      <div className="row g-3">
        <div className="col-4">
          <StatCard label="People" value={data.employees.length} icon="bi-people" />
        </div>
        <div className="col-4">
          <StatCard
            label="Managers"
            value={managerCount}
            icon="bi-person-badge"
            iconBg="var(--mf-color-info-subtle)"
            iconColor="var(--mf-color-info)"
          />
        </div>
        <div className="col-4">
          <StatCard
            label="No manager"
            value={unassignedCount}
            icon="bi-person-dash"
            iconBg="var(--mf-color-warning-subtle)"
            iconColor="var(--mf-color-warning)"
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm rounded-4 mt-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <div className="row g-4 mt-0">
        <div className={selected ? "col-xl-8" : "col-12"}>
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <div className="input-group input-group-sm" style={{ maxWidth: "240px" }}>
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Find a person, role, team…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={onSearchKeyDown}
                  />
                </div>
                <select
                  className="form-select form-select-sm text-capitalize"
                  style={{ maxWidth: "150px" }}
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="">All roles</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
                {deptOptions.length > 0 && (
                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: "170px" }}
                    value={deptFilter}
                    onChange={(event) => setDeptFilter(event.target.value)}
                  >
                    <option value="">All departments</option>
                    {deptOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  className="form-select form-select-sm"
                  style={{ maxWidth: "140px" }}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">Everyone</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
                {filtersActive && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={clearFilters}>
                    Clear
                  </button>
                )}
                <div className="ms-auto d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={expandAll}
                    title="Expand all"
                  >
                    <i className="bi bi-arrows-expand"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={collapseAll}
                    title="Collapse all"
                  >
                    <i className="bi bi-arrows-collapse"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={zoomOut}
                    title="Zoom out"
                  >
                    <i className="bi bi-dash-lg"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={zoomIn}
                    title="Zoom in"
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={fitView}
                    title="Fit to screen"
                  >
                    <i className="bi bi-aspect-ratio"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={resetView}
                    title="Reset view"
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary mb-3"
                    style={{ width: "3rem", height: "3rem" }}
                  ></div>
                  <p className="text-muted mb-0">Loading organization chart…</p>
                </div>
              ) : roots.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-diagram-3 text-primary fs-1"></i>
                  <h5 className="fw-bold mt-3">No reporting structure yet</h5>
                  <p className="text-muted mb-0">
                    Set a reporting manager on employees (from their profile, or when adding them) to
                    build the chart.
                  </p>
                </div>
              ) : (
                <div
                  className="org-viewport"
                  ref={viewportRef}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={endMouse}
                  onMouseLeave={endMouse}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={endTouch}
                >
                  <div
                    className="org-stage"
                    ref={stageRef}
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                  >
                    <ul className="org-tree">
                      {roots.map((root) => (
                        <Node
                          key={String(root._id)}
                          employee={root}
                          childrenOf={childrenOf}
                          sortByName={sortByName}
                          collapsed={collapsed}
                          onToggle={toggle}
                          selectedId={selectedId}
                          onSelect={setSelectedId}
                          dim={filtersActive}
                          matchedIds={matchedIds}
                          seen={new Set()}
                        />
                      ))}
                    </ul>
                  </div>
                  <div className="org-zoom-badge">{Math.round(zoom * 100)}%</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {selected && (
          <div className="col-xl-4">
            <div
              className="card border-0 shadow-sm rounded-4 position-sticky"
              style={{ top: "1rem" }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="org-avatar org-avatar--lg">{initials(selected.name)}</div>
                    <div>
                      <h5 className="fw-bold mb-0">{selected.name}</h5>
                      <div className="small text-muted text-capitalize">
                        {selected.designation || roleLabel(selected.role)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    aria-label="Close"
                    onClick={() => setSelectedId("")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                {selectedStatus && (
                  <span className={`org-status ${selectedStatus.cls} mb-3 d-inline-block`}>
                    {selectedStatus.label}
                  </span>
                )}

                <dl className="row small mb-0">
                  <dt className="col-4 text-muted fw-normal">Role</dt>
                  <dd className="col-8 text-capitalize">{roleLabel(selected.role) || "—"}</dd>
                  {selected.designation && (
                    <>
                      <dt className="col-4 text-muted fw-normal">Designation</dt>
                      <dd className="col-8">{selected.designation}</dd>
                    </>
                  )}
                  {selected.department && (
                    <>
                      <dt className="col-4 text-muted fw-normal">Department</dt>
                      <dd className="col-8">{selected.department}</dd>
                    </>
                  )}
                  <dt className="col-4 text-muted fw-normal">Email</dt>
                  <dd className="col-8 text-break">{selected.email || "—"}</dd>
                  <dt className="col-4 text-muted fw-normal">Reports to</dt>
                  <dd className="col-8">
                    {selectedManager ? (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 align-baseline"
                        onClick={() => setSelectedId(String(selectedManager._id))}
                      >
                        {selectedManager.name}
                      </button>
                    ) : (
                      "—"
                    )}
                  </dd>
                </dl>

                <hr />

                <div className="fw-semibold small mb-2">
                  Direct reports {selectedReports.length > 0 && `(${selectedReports.length})`}
                </div>
                {selectedReports.length === 0 ? (
                  <p className="text-muted small mb-0">No direct reports.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {selectedReports.map((report) => (
                      <li key={String(report._id)} className="mb-1">
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 align-baseline text-start"
                          onClick={() => setSelectedId(String(report._id))}
                        >
                          {report.name}
                        </button>
                        <span className="text-muted small">
                          {" "}
                          — {report.designation || roleLabel(report.role)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {canOpenProfile && (
                  <Link
                    to={`/admin/users/${selected._id}`}
                    className="btn btn-outline-primary w-100 mt-4"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i>View full profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          .org-viewport {
            position: relative;
            overflow: hidden;
            min-height: 60vh;
            border: 1px solid var(--mf-border, #e5e7eb);
            border-radius: 16px;
            background:
              radial-gradient(circle, rgba(15,23,42,.06) 1px, transparent 1px) 0 0 / 22px 22px,
              var(--mf-color-surface-alt, #fbfcfd);
            cursor: grab;
            touch-action: none;
            user-select: none;
          }
          .org-viewport:active { cursor: grabbing; }
          .org-stage {
            display: inline-block;
            padding: 28px 44px;
            transform-origin: top center;
            transition: transform .08s ease-out;
          }
          .org-tree, .org-tree ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            position: relative;
          }
          .org-tree { justify-content: center; }
          .org-tree ul { padding-top: 22px; }
          .org-tree li {
            position: relative;
            padding: 22px 12px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .org-tree li::before, .org-tree li::after {
            content: "";
            position: absolute;
            top: 0;
            width: 50%;
            height: 22px;
            border-top: 2px solid var(--mf-border, #d7dde5);
          }
          .org-tree li::before { right: 50%; }
          .org-tree li::after { left: 50%; border-left: 2px solid var(--mf-border, #d7dde5); }
          .org-tree li:only-child::before, .org-tree li:only-child::after { display: none; }
          .org-tree li:first-child::before, .org-tree li:last-child::after { border: 0; }
          .org-tree li:last-child::before { border-right: 2px solid var(--mf-border, #d7dde5); }
          .org-tree ul::before {
            content: "";
            position: absolute;
            top: 0;
            left: 50%;
            width: 0;
            height: 22px;
            border-left: 2px solid var(--mf-border, #d7dde5);
          }
          .org-tree > li { padding-top: 0; }
          .org-tree > li::before, .org-tree > li::after { display: none; }

          .org-node-head { position: relative; padding-bottom: 12px; }
          .org-card {
            width: 190px;
            background: var(--mf-color-surface, #fff);
            border: 1px solid var(--mf-border, #e5e7eb);
            border-radius: 14px;
            padding: 14px 12px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            text-align: center;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(15,23,42,.05);
            transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
          }
          .org-card:hover { border-color: var(--mf-color-primary, #0d9488); transform: translateY(-1px); }
          .org-card--active {
            border-color: var(--mf-color-primary, #0d9488);
            box-shadow: 0 0 0 3px var(--mf-color-primary-subtle, #ccecea);
          }
          .org-card--dim { opacity: .32; }
          .org-avatar {
            width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 700; margin-bottom: 4px;
            color: var(--mf-color-primary, #0d9488);
            background: var(--mf-color-primary-subtle, #ccecea);
          }
          .org-avatar--lg { width: 48px; height: 48px; font-size: 16px; margin-bottom: 0; }
          .org-name { font-weight: 650; font-size: 13.5px; line-height: 1.25; }
          .org-role { font-size: 12px; color: var(--mf-color-text-muted, #6b7280); text-transform: capitalize; }
          .org-dept { font-size: 11px; color: var(--mf-color-text-muted, #9aa4b2); }
          .org-status {
            margin-top: 6px; font-size: 10.5px; font-weight: 600;
            padding: 1px 8px; border-radius: 999px; text-transform: capitalize;
          }
          .org-status.is-active { background: var(--mf-color-success-subtle, #dcfce7); color: var(--mf-color-success, #16a34a); }
          .org-status.is-inactive { background: var(--mf-color-danger-subtle, #fee2e2); color: var(--mf-color-danger, #dc2626); }
          .org-status.is-pending { background: var(--mf-color-warning-subtle, #fef3c7); color: var(--mf-color-warning, #d97706); }
          .org-toggle {
            position: absolute;
            left: 50%;
            bottom: 0;
            transform: translateX(-50%);
            min-width: 30px; height: 22px; padding: 0 7px;
            border: 1px solid var(--mf-border, #e5e7eb);
            border-radius: 999px;
            background: var(--mf-color-surface, #fff);
            font-size: 11px; font-weight: 700; line-height: 1;
            color: var(--mf-color-primary, #0d9488);
            cursor: pointer;
            z-index: 2;
          }
          .org-toggle:hover { border-color: var(--mf-color-primary, #0d9488); }
          .org-zoom-badge {
            position: absolute; right: 10px; bottom: 10px;
            font-size: 11px; font-weight: 600;
            background: rgba(15,23,42,.68); color: #fff;
            padding: 2px 8px; border-radius: 999px;
            pointer-events: none;
          }
          @media (max-width: 576px) {
            .org-viewport { min-height: 68vh; }
            .org-card { width: 158px; }
          }
          body.dark-mode .org-viewport {
            background:
              radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px) 0 0 / 22px 22px,
              #111827;
            border-color: #374151;
          }
          body.dark-mode .org-card, body.dark-mode .org-toggle { background: #1f2937; border-color: #374151; }
          body.dark-mode .org-tree li::before,
          body.dark-mode .org-tree li::after,
          body.dark-mode .org-tree li:last-child::before,
          body.dark-mode .org-tree ul::before { border-color: #374151; }
        `}
      </style>
    </PageContainer>
  );
};

export default OrgChart;
