import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, searchUsers, deleteUser } from "../../redux/slices/userSlice";
import { Link } from "react-router-dom";
import { PageContainer, PageHeader, StatCard, FilterBar, DataTable, EmptyState } from "../../components/ui";

const ROLE_VARIANT = {
  company_owner: "primary",
  admin: "primary",
  hr: "success",
  hr_manager: "success",
  mr: "warning",
  project_manager: "info",
  manager: "info",
};

const formatRole = (role) =>
  !role ? "—" : role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const getInitials = (name) =>
  !name ? "U" : name.trim().split(" ").slice(0, 2).map((w) => w.charAt(0)).join("").toUpperCase();

const Users = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((s) => s.users);
  const role = useSelector((s) => s.auth?.user?.role);
  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const doSearch = () => dispatch(searchUsers({ name: q }));
  const resetSearch = () => {
    setQ("");
    dispatch(fetchUsers());
  };

  const canManageUsers = ["admin", "company_owner", "hr_manager"].includes(role);

  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    dispatch(deleteUser(id));
  };

  const columns = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div className="d-flex align-items-center gap-3">
          <span
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: 40, height: 40, background: "var(--mf-color-primary-subtle)", color: "var(--mf-color-primary)" }}
          >
            {getInitials(u.name)}
          </span>
          <div>
            <div className="fw-semibold">
              {canManageUsers
                ? <Link to={`/admin/users/${u._id}`} className="text-reset text-decoration-none">{u.name || "—"}</Link>
                : (u.name || "—")}
            </div>
            <small className="text-muted">{u.email || "—"}</small>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (u) => <span className="text-break">{u.email || "—"}</span> },
    {
      key: "role",
      header: "Role",
      render: (u) => <span className={`mf-badge mf-badge--${ROLE_VARIANT[u.role] || "neutral"}`}>{formatRole(u.role)}</span>,
    },
    ...(canManageUsers
      ? [{
          key: "actions",
          header: "",
          align: "right",
          render: (u) => (
            <div className="d-flex justify-content-end gap-2">
              <Link to={`/admin/users/${u._id}`} className="btn btn-sm btn-outline-primary rounded-3"><i className="bi bi-eye me-1"></i> View</Link>
              <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(u._id)} aria-label="Delete user">
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="People"
        title="Employees"
        description="Manage employees, roles and user accounts across your organization."
        actions={
          canManageUsers && (
            <Link className="btn btn-primary rounded-3 fw-semibold" to="/admin/users/add">
              <i className="bi bi-person-plus me-2"></i> Add Employee
            </Link>
          )
        }
      />

      <div className="row g-3">
        <div className="col-6 col-xl-3"><StatCard label="Total Users" value={items?.length || 0} icon="bi-people" /></div>
      </div>

      <FilterBar>
        <FilterBar.Field grow>
          <div className="input-group input-group-sm">
            <span className="input-group-text"><i className="bi bi-search text-muted"></i></span>
            <input
              className="form-control"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
              placeholder="Search users by name…"
            />
            <button className="btn btn-primary" onClick={doSearch}>Search</button>
          </div>
        </FilterBar.Field>
        <FilterBar.Actions>
          <button className="btn btn-ghost btn-sm" onClick={resetSearch}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </FilterBar.Actions>
      </FilterBar>

      {error && !loading && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-start gap-3 mb-0">
          <i className="bi bi-exclamation-triangle fs-5"></i>
          <div>
            <div className="fw-bold">Unable to load users</div>
            <p className="small mb-0">{error?.message || "Please try again."}</p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={items || []}
        pageSize={25}
        rowKey={(u) => u._id}
        loading={loading}
        mobileCards
        empty={<EmptyState icon="bi-people" title="No users found" description="There are no users matching your search." />}
      />
    </PageContainer>
  );
};

export default Users;
