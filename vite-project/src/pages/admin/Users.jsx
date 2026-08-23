import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  searchUsers,
  deleteUser,
} from "../../redux/slices/userSlice";
import { Link } from "react-router-dom";

const Users = () => {
  const dispatch = useDispatch();

  const { items, loading, error } = useSelector((s) => s.users);
  const role = useSelector((s) => s.auth?.user?.role);

  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const doSearch = () => {
    dispatch(searchUsers({ name: q }));
  };

  const canManageUsers = [
    "admin",
    "company_owner",
    "hr_manager",
  ].includes(role);

  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    dispatch(deleteUser(id));
  };

  const formatRole = (role) => {
    if (!role) return "N/A";

    return role
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case "company_owner":
        return {
          background: "#e7f1ff",
          color: "#0d6efd",
        };
      case "admin":
        return {
          background: "#f0e7ff",
          color: "#6f42c1",
        };
      case "hr":
      case "hr_manager":
        return {
          background: "#e7f8ef",
          color: "#198754",
        };
      case "mr":
        return {
          background: "#fff3e0",
          color: "#fd7e14",
        };
      case "project_manager":
        return {
          background: "#e8f7fa",
          color: "#0dcaf0",
        };
      default:
        return {
          background: "#f1f3f5",
          color: "#6c757d",
        };
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

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
                    <i className="bi bi-people fs-3"></i>
                  </div>

                  <div>
                    <span className="small opacity-75">
                      ORGANIZATION
                    </span>

                    <h2 className="fw-bold mb-0">
                      Users
                    </h2>
                  </div>

                </div>

                <p className="mb-0 opacity-75">
                  Manage employees, roles and user accounts across
                  your organization.
                </p>
              </div>

              <div className="col-lg-4 mt-4 mt-lg-0">
                <div className="d-flex justify-content-lg-end">

                  <div
                    className="bg-white bg-opacity-10 rounded-4 px-4 py-3 text-center"
                    style={{ minWidth: "140px" }}
                  >
                    <div className="fs-2 fw-bold">
                      {items?.length || 0}
                    </div>

                    <div className="small opacity-75">
                      Total Users
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">

            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">

              <div>
                <h5 className="fw-bold mb-1">
                  User Directory
                </h5>

                <p className="text-muted small mb-0">
                  Search and manage users in your organization.
                </p>
              </div>

              {canManageUsers && (
                <Link
                  className="btn btn-primary rounded-3 px-4"
                  to="/admin/users/add"
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Add Employee
                </Link>
              )}

            </div>

            <hr className="my-4" />

            <div className="row g-2">

              <div className="col-md-8 col-lg-6">
                <div className="input-group">

                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>

                  <input
                    className="form-control border-start-0 shadow-none"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        doSearch();
                      }
                    }}
                    placeholder="Search users by name..."
                  />

                  <button
                    className="btn btn-primary px-4"
                    onClick={doSearch}
                  >
                    Search
                  </button>

                </div>
              </div>

              <div className="col-md-auto">
                <button
                  className="btn btn-light border w-100"
                  onClick={() => {
                    setQ("");
                    dispatch(fetchUsers());
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
              </div>

            </div>

          </div>
        </div>

        {loading && (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">

              <div
                className="spinner-border text-primary mb-3"
                style={{
                  width: "2.8rem",
                  height: "2.8rem",
                }}
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <h6 className="fw-semibold">
                Loading users
              </h6>

              <p className="text-muted small mb-0">
                Please wait while we fetch the user directory.
              </p>

            </div>
          </div>
        )}

        {error && !loading && (
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
                    Unable to load users
                  </h6>

                  <p className="small mb-0">
                    {error?.message ||
                      JSON.stringify(error)}
                  </p>
                </div>

              </div>

            </div>
          </div>
        )}

        {!loading &&
          !error &&
          items?.length === 0 && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center py-5">

                <div
                  className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: "85px",
                    height: "85px",
                    background:
                      "linear-gradient(135deg, #e7f1ff, #ede7ff)",
                  }}
                >
                  <i className="bi bi-people text-primary fs-1"></i>
                </div>

                <h5 className="fw-bold mb-2">
                  No users found
                </h5>

                <p className="text-muted mb-0">
                  There are no users matching your search.
                </p>

              </div>
            </div>
          )}

        {!loading &&
          !error &&
          items?.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

              <div className="card-header bg-white border-0 p-4">
                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <h5 className="fw-bold mb-1">
                      All Users
                    </h5>

                    <p className="text-muted small mb-0">
                      {items.length}{" "}
                      {items.length === 1
                        ? "user"
                        : "users"}{" "}
                      available
                    </p>
                  </div>

                  <div
                    className="rounded-pill px-3 py-2"
                    style={{
                      backgroundColor: "#f0f6ff",
                      color: "#0d6efd",
                    }}
                  >
                    <i className="bi bi-people me-2"></i>
                    <span className="fw-semibold small">
                      User Directory
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
                        <th className="border-0 px-4 py-3 text-muted small">
                          USER
                        </th>

                        <th className="border-0 py-3 text-muted small">
                          EMAIL
                        </th>

                        <th className="border-0 py-3 text-muted small">
                          ROLE
                        </th>

                        {canManageUsers && (
                          <th className="border-0 py-3 text-muted small text-end px-4">
                            ACTIONS
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody>

                      {items.map((u) => {
                        const roleStyle = getRoleStyle(
                          u.role
                        );

                        return (
                          <tr key={u._id}>

                            <td className="px-4 py-4">
                              <div className="d-flex align-items-center gap-3">

                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                  style={{
                                    width: "45px",
                                    height: "45px",
                                    background:
                                      "linear-gradient(135deg, #e7f1ff, #ede7ff)",
                                    color: "#0d6efd",
                                  }}
                                >
                                  {getInitials(u.name)}
                                </div>

                                <div>
                                  <div className="fw-bold text-dark">
                                    {u.name || "N/A"}
                                  </div>

                                  <small className="text-muted">
                                    ID: {u._id}
                                  </small>
                                </div>

                              </div>
                            </td>

                            <td className="py-4">
                              <div className="d-flex align-items-center gap-2">

                                <i className="bi bi-envelope text-muted"></i>

                                <span className="text-break">
                                  {u.email || "N/A"}
                                </span>

                              </div>
                            </td>

                            <td className="py-4">
                              <span
                                className="badge rounded-pill px-3 py-2"
                                style={roleStyle}
                              >
                                <i className="bi bi-person-badge me-1"></i>
                                {formatRole(u.role)}
                              </span>
                            </td>

                            {canManageUsers && (
                              <td className="py-4 px-4">
                                <div className="d-flex justify-content-end gap-2">

                                  <Link
                                    to={`/admin/users/${u._id}`}
                                    className="btn btn-sm btn-outline-primary rounded-3 px-3"
                                  >
                                    <i className="bi bi-eye me-1"></i>
                                    View
                                  </Link>

                                  <button
                                    className="btn btn-sm btn-outline-danger rounded-3 px-3"
                                    onClick={() =>
                                      handleDelete(u._id)
                                    }
                                  >
                                    <i className="bi bi-trash me-1"></i>
                                    Delete
                                  </button>

                                </div>
                              </td>
                            )}

                          </tr>
                        );
                      })}

                    </tbody>

                  </table>

                </div>

              </div>
            </div>
          )}

      </div>
    </div>
  );
};

export default Users;