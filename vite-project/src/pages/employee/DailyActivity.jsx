import { useEffect, useState } from "react";
import activityApi from "../../api/activityApi";
import projectApi from "../../api/projectApi";

const DailyActivity = () => {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    hoursWorked: 8,
    status: "IN_PROGRESS",
    projectId: "",
    notes: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [activityResponse, projectResponse] =
        await Promise.all([
          activityApi.listActivities(),
          projectApi.listProjects(),
        ]);

      setActivities(activityResponse.activities || []);
      setProjects(projectResponse.projects || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load work activity"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await activityApi.createActivity({
        ...form,
        hoursWorked: Number(form.hoursWorked),
        projectId: form.projectId || undefined,
      });

      setForm((current) => ({
        ...current,
        description: "",
        notes: "",
      }));

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to submit activity"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-success-subtle text-success";

      case "IN_PROGRESS":
        return "bg-primary-subtle text-primary";

      case "BLOCKED":
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

      case "BLOCKED":
        return "bi-exclamation-circle-fill";

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

  const totalHours = activities.reduce(
    (total, activity) =>
      total + Number(activity.hoursWorked || 0),
    0
  );

  const completedActivities = activities.filter(
    (activity) => activity.status === "COMPLETED"
  ).length;

  const inProgressActivities = activities.filter(
    (activity) => activity.status === "IN_PROGRESS"
  ).length;

  const today = new Date().toISOString().slice(0, 10);

  const todayActivities = activities.filter(
    (activity) => {
      if (!activity.date) return false;

      return (
        new Date(activity.date)
          .toISOString()
          .slice(0, 10) === today
      );
    }
  );

  const todayHours = todayActivities.reduce(
    (total, activity) =>
      total + Number(activity.hoursWorked || 0),
    0
  );

  return (
    <div className="daily-activity-page min-vh-100 bg-light py-4 py-md-5">
      <div className="container-fluid px-3 px-md-4">

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                <i className="bi bi-activity me-1"></i>
                Work Tracking
              </span>
            </div>

            <h2 className="fw-bold mb-1">
              Daily Work Activity
            </h2>

            <p className="text-muted mb-0">
              Record and track your daily work, projects and
              working hours.
            </p>
          </div>

          <div className="activity-date-card">
            <div className="activity-date-icon">
              <i className="bi bi-calendar-check"></i>
            </div>

            <div>
              <small className="text-muted d-block">
                Today
              </small>

              <strong>
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
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
                <small>Total Activities</small>
                <h3>{activities.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-card-icon bg-success-subtle text-success">
                <i className="bi bi-check-circle"></i>
              </div>

              <div>
                <small>Completed</small>
                <h3>{completedActivities}</h3>
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
                <h3>{inProgressActivities}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-card-icon bg-warning-subtle text-warning-emphasis">
                <i className="bi bi-clock-history"></i>
              </div>

              <div>
                <small>Total Hours</small>
                <h3>{totalHours}</h3>
              </div>
            </div>
          </div>

        </div>

        <div className="row g-3 mb-4">

          <div className="col-md-6">
            <div className="summary-card">
              <div className="summary-icon bg-primary-subtle text-primary">
                <i className="bi bi-calendar-day"></i>
              </div>

              <div>
                <small>Today's Activities</small>
                <h4>{todayActivities.length}</h4>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="summary-card">
              <div className="summary-icon bg-success-subtle text-success">
                <i className="bi bi-hourglass-split"></i>
              </div>

              <div>
                <small>Today's Working Hours</small>
                <h4>{todayHours} hrs</h4>
              </div>
            </div>
          </div>

        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">

            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="section-icon bg-primary-subtle text-primary">
                <i className="bi bi-plus-lg"></i>
              </div>

              <div>
                <h5 className="fw-bold mb-1">
                  Submit Daily Activity
                </h5>

                <p className="text-muted small mb-0">
                  Add details about the work you completed or
                  are currently working on.
                </p>
              </div>
            </div>

            <form onSubmit={submit}>
              <div className="row g-3">

                <div className="col-xl-2 col-md-4">
                  <label className="form-label fw-semibold">
                    Date
                  </label>

                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-calendar3 text-muted"></i>
                    </span>

                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          date: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="col-xl-3 col-md-8">
                  <label className="form-label fw-semibold">
                    Work Description
                  </label>

                  <input
                    className="form-control"
                    placeholder="What did you work on?"
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-xl-2 col-md-4">
                  <label className="form-label fw-semibold">
                    Project
                  </label>

                  <select
                    className="form-select"
                    value={form.projectId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        projectId: event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select Project
                    </option>

                    {projects.map((project) => (
                      <option
                        key={project._id}
                        value={project._id}
                      >
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-xl-1 col-md-4">
                  <label className="form-label fw-semibold">
                    Hours
                  </label>

                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={form.hoursWorked}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        hoursWorked: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-xl-2 col-md-4">
                  <label className="form-label fw-semibold">
                    Status
                  </label>

                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value,
                      })
                    }
                  >
                    <option value="TODO">
                      TODO
                    </option>

                    <option value="IN_PROGRESS">
                      IN PROGRESS
                    </option>

                    <option value="COMPLETED">
                      COMPLETED
                    </option>

                    <option value="BLOCKED">
                      BLOCKED
                    </option>
                  </select>
                </div>

                <div className="col-xl-2 col-md-4 d-flex align-items-end">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Activity
                      </>
                    )}
                  </button>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Notes
                    <span className="text-muted fw-normal">
                      {" "}
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add additional notes about your work..."
                    value={form.notes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        notes: event.target.value,
                      })
                    }
                  />
                </div>

              </div>
            </form>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

          <div className="card-header bg-white border-0 p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

              <div className="d-flex align-items-center gap-3">
                <div className="section-icon bg-success-subtle text-success">
                  <i className="bi bi-clock-history"></i>
                </div>

                <div>
                  <h5 className="fw-bold mb-1">
                    Activity History
                  </h5>

                  <p className="text-muted small mb-0">
                    Review your submitted daily work activities.
                  </p>
                </div>
              </div>

              <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                {activities.length} Activities
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
                Loading activities...
              </h6>

              <p className="text-muted small mb-0">
                Please wait while we fetch your work activity.
              </p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-5 px-4">

              <div className="empty-icon mx-auto mb-3">
                <i className="bi bi-clipboard2-x"></i>
              </div>

              <h5 className="fw-bold">
                No activity submitted yet
              </h5>

              <p className="text-muted mb-0">
                Submit your first daily work activity using the
                form above.
              </p>

            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0 activity-table">

                <thead>
                  <tr>
                    <th className="ps-4">
                      Date
                    </th>

                    <th>
                      Work Description
                    </th>

                    <th>
                      Project
                    </th>

                    <th>
                      Hours
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="pe-4">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity._id}>

                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="date-icon">
                            <i className="bi bi-calendar3"></i>
                          </div>

                          <div>
                            <div className="fw-semibold">
                              {activity.date
                                ? new Date(
                                    activity.date
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
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="fw-semibold">
                          {activity.description || "-"}
                        </div>
                      </td>

                      <td>
                        {activity.projectId?.name ? (
                          <span className="project-badge">
                            <i className="bi bi-folder2-open me-1"></i>
                            {activity.projectId.name}
                          </span>
                        ) : (
                          <span className="text-muted">
                            No project
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="hours-badge">
                          <i className="bi bi-clock me-1"></i>
                          {activity.hoursWorked || 0} hrs
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            activity.status
                          )}`}
                        >
                          <i
                            className={`bi ${getStatusIcon(
                              activity.status
                            )}`}
                          ></i>

                          {formatStatus(activity.status)}
                        </span>
                      </td>

                      <td className="pe-4">
                        {activity.notes ? (
                          <span
                            className="text-muted small"
                            title={activity.notes}
                          >
                            {activity.notes.length > 60
                              ? `${activity.notes.substring(
                                  0,
                                  60
                                )}...`
                              : activity.notes}
                          </span>
                        ) : (
                          <span className="text-muted">
                            -
                          </span>
                        )}
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
        .daily-activity-page {
          color: #212529;
        }

        .activity-date-card {
          background: #fff;
          border: 1px solid #edf0f4;
          border-radius: 14px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
        }

        .activity-date-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
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

        .summary-card {
          background: #fff;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid #edf0f4;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
        }

        .summary-icon {
          width: 45px;
          height: 45px;
          min-width: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .summary-card small {
          color: #6c757d;
          display: block;
        }

        .summary-card h4 {
          margin: 2px 0 0;
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

        .submit-btn {
          min-height: 38px;
          border-radius: 9px;
        }

        .activity-table {
          min-width: 950px;
        }

        .activity-table thead th {
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

        .activity-table tbody td {
          padding-top: 18px;
          padding-bottom: 18px;
          border-color: #f0f2f5;
        }

        .activity-table tbody tr {
          transition: background 0.2s ease;
        }

        .activity-table tbody tr:hover {
          background: #fafbff;
        }

        .date-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 10px;
          background: #f1f4f9;
          color: #0d6efd;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .project-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 50px;
          background: #eef4ff;
          color: #0d6efd;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .hours-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 50px;
          background: #f8f9fa;
          color: #495057;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
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

        .form-control,
        .form-select {
          border-radius: 9px;
          min-height: 40px;
        }

        .form-control:focus,
        .form-select:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
        }

        @media (max-width: 767px) {
          .daily-activity-page {
            padding-top: 20px !important;
          }

          .activity-date-card {
            width: 100%;
          }

          .activity-table {
            min-width: 950px;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyActivity;