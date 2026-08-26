import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import taskApi from "../../api/taskApi";
import userApi from "../../api/userApi";

const Tasks = () => {
  const { user } = useSelector((state) => state.auth);

  const canCreateTask = [
    "admin",
    "company_owner",
    "hr",
    "hr_manager",
    "project_manager",
  ].includes(user?.role);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [taskResponse, userResponse] = await Promise.all([
        taskApi.listTasks(),
        userApi.listColleagues(),
      ]);

      setTasks(taskResponse.tasks || []);
      setUsers(userResponse.users || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      taskApi.listTasks(),
      userApi.listUsers(),
    ])
      .then(([taskResponse, userResponse]) => {
        if (cancelled) return;

        setTasks(taskResponse.tasks || []);
        setUsers(userResponse.users || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Unable to load tasks"
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const create = async (event) => {
    event.preventDefault();

    if (!canCreateTask) {
      setError("You are not authorized to create tasks.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await taskApi.createTask(form);

      setForm({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
      });

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create task"
      );
    } finally {
      setCreating(false);
    }
  };

  const update = async (id, status) => {
    try {
      setUpdatingId(id);
      setError("");

      await taskApi.updateTask(id, { status });

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to update task"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-success-subtle text-success";

      case "IN_PROGRESS":
        return "bg-primary-subtle text-primary";

      case "CANCELLED":
        return "bg-danger-subtle text-danger";

      case "TODO":
      default:
        return "bg-warning-subtle text-warning-emphasis";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bi-check-circle-fill";

      case "IN_PROGRESS":
        return "bi-arrow-repeat";

      case "CANCELLED":
        return "bi-x-circle-fill";

      case "TODO":
      default:
        return "bi-clock-fill";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .split("_")
      .map(
        (word) =>
          word.charAt(0) +
          word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  return (
    <div className="tasks-page min-vh-100 bg-light py-4 py-md-5">
      <div className="container-fluid px-3 px-md-4">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                <i className="bi bi-kanban me-1"></i>
                Task Management
              </span>
            </div>

            <h2 className="fw-bold mb-1">
              Tasks
            </h2>

            <p className="text-muted mb-0">
              Create, assign and track tasks across your team.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="stat-mini">
              <span className="stat-mini-icon text-primary">
                <i className="bi bi-list-task"></i>
              </span>

              <div>
                <small>Total</small>
                <strong>{tasks.length}</strong>
              </div>
            </div>

            <div className="stat-mini">
              <span className="stat-mini-icon text-success">
                <i className="bi bi-check-circle"></i>
              </span>

              <div>
                <small>Done</small>
                <strong>{completedTasks}</strong>
              </div>
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
                  Something went wrong
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
              <div className="stat-card-icon bg-primary-subtle text-primary">
                <i className="bi bi-list-check"></i>
              </div>

              <div>
                <small>Total Tasks</small>
                <h3>{tasks.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-card-icon bg-warning-subtle text-warning-emphasis">
                <i className="bi bi-hourglass-split"></i>
              </div>

              <div>
                <small>Pending</small>
                <h3>{pendingTasks}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-card-icon bg-info-subtle text-info">
                <i className="bi bi-arrow-repeat"></i>
              </div>

              <div>
                <small>In Progress</small>
                <h3>{inProgressTasks}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-card-icon bg-success-subtle text-success">
                <i className="bi bi-check2-all"></i>
              </div>

              <div>
                <small>Completed</small>
                <h3>{completedTasks}</h3>
              </div>
            </div>
          </div>

        </div>

        {canCreateTask && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">

              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="section-icon bg-primary-subtle text-primary">
                  <i className="bi bi-plus-lg"></i>
                </div>

                <div>
                  <h5 className="fw-bold mb-1">
                    Create New Task
                  </h5>

                  <p className="text-muted small mb-0">
                    Assign a new task to a team member.
                  </p>
                </div>
              </div>

              <form onSubmit={create}>
                <div className="row g-3">

                  <div className="col-lg-3 col-md-6">
                    <label className="form-label fw-semibold">
                      Task Title
                    </label>

                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-card-heading text-muted"></i>
                      </span>

                      <input
                        className="form-control border-start-0"
                        placeholder="Enter task title"
                        value={form.title}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            title: event.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6">
                    <label className="form-label fw-semibold">
                      Description
                    </label>

                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-text-paragraph text-muted"></i>
                      </span>

                      <input
                        className="form-control border-start-0"
                        placeholder="Task description"
                        value={form.description}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            description: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6">
                    <label className="form-label fw-semibold">
                      Assign To
                    </label>

                    <select
                      className="form-select"
                      value={form.assignedTo}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          assignedTo: event.target.value,
                        })
                      }
                      required
                    >
                      <option value="">
                        Select team member
                      </option>

                      {users.map((user) => (
                        <option
                          key={user._id}
                          value={user._id}
                        >
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-lg-2 col-md-6">
                    <label className="form-label fw-semibold">
                      Due Date
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      value={form.dueDate}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          dueDate: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-lg-1 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary w-100 create-btn"
                      disabled={creating}
                    >
                      {creating ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                      ) : (
                        <i className="bi bi-plus-lg"></i>
                      )}
                    </button>
                  </div>

                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

          <div className="card-header bg-white border-0 p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

              <div className="d-flex align-items-center gap-3">
                <div className="section-icon bg-success-subtle text-success">
                  <i className="bi bi-kanban"></i>
                </div>

                <div>
                  <h5 className="fw-bold mb-1">
                    Task Overview
                  </h5>

                  <p className="text-muted small mb-0">
                    Manage your team's tasks and progress.
                  </p>
                </div>
              </div>

              <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                {tasks.length} Total
              </span>

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
                Loading tasks...
              </h6>

              <p className="text-muted small mb-0">
                Please wait while we fetch your tasks.
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-5 px-4">
              <div className="empty-icon mx-auto mb-3">
                <i className="bi bi-clipboard2-x"></i>
              </div>

              <h5 className="fw-bold">
                No tasks yet
              </h5>

              <p className="text-muted mb-0">
                {canCreateTask
                  ? "Create your first task using the form above."
                  : "No tasks are currently assigned to you."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0 task-table">

                <thead>
                  <tr>
                    <th className="ps-4">Task</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="pe-4">Update</th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id}>

                      <td className="ps-4">
                        <div className="d-flex align-items-start gap-3">

                          <div className="task-icon">
                            <i className="bi bi-check2-square"></i>
                          </div>

                          <div>
                            <div className="fw-bold">
                              {task.title}
                            </div>

                            {task.description && (
                              <div className="small text-muted mt-1">
                                {task.description}
                              </div>
                            )}
                          </div>

                        </div>
                      </td>

                      <td>
                        {task.assignedTo ? (
                          <div className="d-flex align-items-center gap-2">

                            <div className="user-avatar">
                              {(task.assignedTo.name || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <div className="fw-semibold">
                                {task.assignedTo.name || "-"}
                              </div>

                              {task.assignedTo.role && (
                                <small className="text-muted text-capitalize">
                                  {task.assignedTo.role.replace(
                                    /_/g,
                                    " "
                                  )}
                                </small>
                              )}
                            </div>

                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        {task.dueDate ? (
                          <div className="small">
                            <i className="bi bi-calendar3 me-2 text-muted"></i>

                            {new Date(
                              task.dueDate
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">
                            No due date
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            task.status
                          )}`}
                        >
                          <i
                            className={`bi ${getStatusIcon(
                              task.status
                            )}`}
                          ></i>

                          {formatStatus(task.status)}
                        </span>
                      </td>

                      <td className="pe-4">
                        <select
                          className="form-select form-select-sm status-select"
                          value={task.status}
                          disabled={updatingId === task._id}
                          onChange={(event) =>
                            update(
                              task._id,
                              event.target.value
                            )
                          }
                        >
                          <option value="TODO">
                            TODO
                          </option>

                          <option value="IN_PROGRESS">
                            IN_PROGRESS
                          </option>

                          <option value="COMPLETED">
                            COMPLETED
                          </option>

                          <option value="CANCELLED">
                            CANCELLED
                          </option>
                        </select>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .tasks-page {
          color: #212529;
        }

        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid #edf0f4;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
          transition: all 0.25s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.07);
        }

        .stat-card-icon {
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

        .stat-mini {
          background: #fff;
          border: 1px solid #edf0f4;
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-mini-icon {
          font-size: 17px;
        }

        .stat-mini small,
        .stat-mini strong {
          display: block;
          line-height: 1.1;
        }

        .stat-mini small {
          color: #6c757d;
          font-size: 11px;
        }

        .stat-mini strong {
          font-size: 15px;
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

        .create-btn {
          height: 38px;
          border-radius: 9px;
        }

        .task-table thead th {
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

        .task-table tbody td {
          padding-top: 18px;
          padding-bottom: 18px;
          border-color: #f0f2f5;
        }

        .task-table tbody tr {
          transition: background 0.2s ease;
        }

        .task-table tbody tr:hover {
          background: #fafbff;
        }

        .task-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 11px;
          background: #eef4ff;
          color: var(--mf-color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          background: #e9ecef;
          color: #495057;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 50px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-select {
          min-width: 135px;
          border-radius: 8px;
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

        @media (max-width: 991px) {
          .stat-mini {
            display: none;
          }
        }

        @media (max-width: 767px) {
          .tasks-page {
            padding-top: 20px !important;
          }

          .task-table {
            min-width: 900px;
          }
        }
      `}</style>
    </div>
  );
};

export default Tasks;