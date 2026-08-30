import { useEffect, useMemo, useState } from "react";
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

// Turn the flat employee list into a single tree. The company owner is always
// the root: anyone without a (resolvable) manager is placed directly under the
// owner. Falls back to a multi-root forest when no owner is set.
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

  return { roots, childrenOf, byId, sortByName };
}

const Node = ({ employee, childrenOf, sortByName, query, selectedId, onSelect, seen }) => {
  const id = String(employee._id);
  const directReports = seen.has(id) ? [] : sortByName(childrenOf.get(id) || []);
  const nextSeen = new Set(seen).add(id);
  const [open, setOpen] = useState(true);

  const matches =
    !query ||
    (employee.name || "").toLowerCase().includes(query) ||
    roleLabel(employee.role).toLowerCase().includes(query) ||
    (employee.designation || "").toLowerCase().includes(query);

  return (
    <li className="org-node">
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
        className={`org-card ${matches ? "" : "org-card--dim"} ${selectedId === id ? "org-card--active" : ""}`}
      >
        <div className="org-avatar">{initials(employee.name)}</div>
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-semibold text-truncate">{employee.name}</span>
            {employee.active === false && <span className="badge text-bg-secondary">Inactive</span>}
          </div>
          <div className="small text-muted text-capitalize text-truncate">
            {employee.designation || roleLabel(employee.role)}
            {employee.department ? ` · ${employee.department}` : ""}
          </div>
        </div>
        {directReports.length > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-light border flex-shrink-0"
            onClick={(event) => {
              event.stopPropagation();
              setOpen((value) => !value);
            }}
            aria-expanded={open}
            aria-label={open ? "Collapse reports" : "Expand reports"}
          >
            <i className={`bi ${open ? "bi-dash" : "bi-plus"}`}></i> {directReports.length}
          </button>
        )}
      </div>

      {open && directReports.length > 0 && (
        <ul className="org-children">
          {directReports.map((report) => (
            <Node
              key={String(report._id)}
              employee={report}
              childrenOf={childrenOf}
              sortByName={sortByName}
              query={query}
              selectedId={selectedId}
              onSelect={onSelect}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const viewerRole = useSelector((state) => state.auth.user?.role);
  const canOpenProfile = PRIVILEGED_VIEWERS.includes(viewerRole);

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

  const { roots, childrenOf, byId, sortByName } = useMemo(
    () => buildTree(data.employees, data.companyOwnerId),
    [data.employees, data.companyOwnerId]
  );
  const query = search.trim().toLowerCase();

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
    if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId, loading]);

  const selected = selectedId ? byId.get(String(selectedId)) : null;
  const selectedManager = selected?.reportingManagerId ? byId.get(String(selected.reportingManagerId)) : null;
  const selectedReports = selected ? sortByName(childrenOf.get(String(selected._id)) || []) : [];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Company"
        title="Organization Chart"
        description={data.companyName ? `${data.companyName} — reporting structure` : "Reporting structure across the company."}
      />

      <div className="row g-3">
        <div className="col-4"><StatCard label="People" value={data.employees.length} icon="bi-people" /></div>
        <div className="col-4"><StatCard label="Managers" value={managerCount} icon="bi-person-badge" iconBg="var(--mf-color-info-subtle)" iconColor="var(--mf-color-info)" /></div>
        <div className="col-4"><StatCard label="No manager" value={unassignedCount} icon="bi-person-dash" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
      </div>

      <div className="container-fluid px-0">

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <div className="row g-4">
          <div className={selected ? "col-lg-8" : "col-12"}>
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="input-group mb-4" style={{ maxWidth: "360px" }}>
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Find a person or role…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
                    <p className="text-muted mb-0">Loading organization chart…</p>
                  </div>
                ) : roots.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-diagram-3 text-primary fs-1"></i>
                    <h5 className="fw-bold mt-3">No reporting structure yet</h5>
                    <p className="text-muted mb-0">
                      Set a reporting manager on employees (from their profile, or when adding them) to build the chart.
                    </p>
                  </div>
                ) : (
                  <div className="org-scroll">
                    <ul className="org-tree">
                      {roots.map((root) => (
                        <Node
                          key={String(root._id)}
                          employee={root}
                          childrenOf={childrenOf}
                          sortByName={sortByName}
                          query={query}
                          selectedId={selectedId}
                          onSelect={setSelectedId}
                          seen={new Set()}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selected && (
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 position-sticky" style={{ top: "1rem" }}>
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

                  <dl className="row small mb-0">
                    <dt className="col-4 text-muted fw-normal">Role</dt>
                    <dd className="col-8 text-capitalize">{roleLabel(selected.role) || "—"}</dd>
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
                        <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setSelectedId(String(selectedManager._id))}>
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
                          <span className="text-muted small"> — {report.designation || roleLabel(report.role)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {canOpenProfile && (
                    <Link to={`/admin/users/${selected._id}`} className="btn btn-outline-primary w-100 mt-4">
                      <i className="bi bi-box-arrow-up-right me-1"></i>View full profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          .org-scroll { overflow-x: auto; }
          .org-tree, .org-children { list-style: none; margin: 0; padding: 0; }
          .org-children { margin-left: 22px; padding-left: 18px; border-left: 2px solid var(--mf-border, #e5e7eb); }
          .org-node { margin: 8px 0; }
          .org-card {
            display: flex; align-items: center; gap: 12px;
            background: #fff; border: 1px solid var(--mf-border, #e5e7eb);
            border-radius: 12px; padding: 10px 14px; width: 420px; max-width: 100%;
            box-shadow: 0 1px 2px rgba(15,23,42,.04); cursor: pointer;
            transition: border-color .15s ease, box-shadow .15s ease;
          }
          .org-card:hover { border-color: var(--mf-color-primary, #2563eb); }
          .org-card--active { border-color: var(--mf-color-primary, #2563eb); box-shadow: 0 0 0 3px var(--mf-color-primary-subtle, #e7f1ff); }
          .org-card--dim { opacity: .4; }
          .org-avatar {
            width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 700; color: var(--mf-color-primary, #2563eb);
            background: var(--mf-color-primary-subtle, #e7f1ff);
          }
          .org-avatar--lg { width: 48px; height: 48px; font-size: 16px; }
          .min-w-0 { min-width: 0; }
          body.dark-mode .org-card { background: #1f2937; border-color: #374151; }
          body.dark-mode .org-children { border-left-color: #374151; }
        `}
      </style>
    </PageContainer>
  );
};

export default OrgChart;
