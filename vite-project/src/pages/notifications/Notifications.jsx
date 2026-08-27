import { useEffect, useState } from "react";
import notificationApi from "../../api/notificationApi";

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await notificationApi.listNotifications();
      setItems(response.notifications || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const read = async (id) => {
    try {
      setReadingId(id);

      await notificationApi.markNotificationRead(id);

      setItems((currentItems) =>
        currentItems.map((item) =>
          item._id === id
            ? {
                ...item,
                readAt: item.readAt || new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to update notification"
      );
    } finally {
      setReadingId(null);
    }
  };

  const unreadCount = items.filter(
    (item) => !item.readAt
  ).length;

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)",
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
                    <i className="bi bi-bell fs-3"></i>
                  </div>

                  <div>
                    <span className="small opacity-75">
                      ACTIVITY CENTER
                    </span>

                    <h2 className="fw-bold mb-0">
                      Notifications
                    </h2>
                  </div>

                </div>

                <p className="mb-0 opacity-75">
                  Stay updated with important alerts, activities
                  and account notifications.
                </p>
              </div>

              <div className="col-lg-4 mt-4 mt-lg-0">
                <div className="d-flex justify-content-lg-end">

                  <div
                    className="bg-white bg-opacity-10 rounded-4 px-4 py-3 text-center"
                    style={{ minWidth: "140px" }}
                  >
                    <div className="fs-2 fw-bold">
                      {unreadCount}
                    </div>

                    <div className="small opacity-75">
                      Unread
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4 d-flex align-items-center gap-3">
            <div
              className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center"
              style={{
                width: "42px",
                height: "42px",
              }}
            >
              <i className="bi bi-exclamation-triangle"></i>
            </div>

            <div>
              <div className="fw-semibold">
                Something went wrong
              </div>

              <small>{error}</small>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

          <div className="card-header bg-white border-0 p-4">

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

              <div>
                <h5 className="fw-bold mb-1">
                  Notification Center
                </h5>

                <p className="text-muted small mb-0">
                  {items.length}{" "}
                  {items.length === 1
                    ? "notification"
                    : "notifications"}{" "}
                  available
                </p>
              </div>

              <button
                type="button"
                className="btn btn-light border rounded-3 px-3"
                onClick={load}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>

            </div>

          </div>

          <div className="card-body p-0">

            {loading ? (
              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary mb-3"
                  style={{
                    width: "2.7rem",
                    height: "2.7rem",
                  }}
                  role="status"
                >
                  <span className="visually-hidden">
                    Loading...
                  </span>
                </div>

                <h6 className="fw-semibold mb-1">
                  Loading notifications
                </h6>

                <p className="text-muted small mb-0">
                  Please wait...
                </p>

              </div>
            ) : !items.length ? (
              <div className="text-center py-5 px-4">

                <div
                  className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: "85px",
                    height: "85px",
                    background:
                      "linear-gradient(135deg, #e7f1ff, #ede7ff)",
                  }}
                >
                  <i className="bi bi-bell-slash text-primary fs-1"></i>
                </div>

                <h5 className="fw-bold mb-2">
                  No notifications
                </h5>

                <p
                  className="text-muted mb-0 mx-auto"
                  style={{ maxWidth: "450px" }}
                >
                  You're all caught up. New notifications will
                  appear here when there is something important
                  to show you.
                </p>

              </div>
            ) : (
              <div className="list-group list-group-flush">

                {items.map((item) => {
                  const unread = !item.readAt;

                  return (
                    <button
                      type="button"
                      key={item._id}
                      onClick={() => read(item._id)}
                      disabled={readingId === item._id}
                      className="list-group-item list-group-item-action border-0 px-4 py-4"
                      style={{
                        backgroundColor: unread
                          ? "#f8fbff"
                          : "#ffffff",
                        borderBottom:
                          "1px solid #f0f1f3",
                      }}
                    >
                      <div className="d-flex align-items-start gap-3">

                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: unread
                              ? "#e7f1ff"
                              : "#f1f3f5",
                            color: unread
                              ? "var(--mf-color-primary)"
                              : "#6c757d",
                          }}
                        >
                          <i
                            className={
                              unread
                                ? "bi bi-bell-fill fs-5"
                                : "bi bi-bell fs-5"
                            }
                          ></i>
                        </div>

                        <div className="flex-grow-1 text-start">

                          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">

                            <div className="d-flex align-items-center gap-2">

                              <h6
                                className={`mb-0 ${
                                  unread
                                    ? "fw-bold text-dark"
                                    : "fw-semibold text-secondary"
                                }`}
                              >
                                {item.title}
                              </h6>

                              {unread && (
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    backgroundColor:
                                      "var(--mf-color-primary)",
                                  }}
                                >
                                  New
                                </span>
                              )}

                            </div>

                            <small className="text-muted flex-shrink-0">
                              {formatDate(item.createdAt)}
                            </small>

                          </div>

                          <p
                            className={`mb-2 mt-2 ${
                              unread
                                ? "text-dark"
                                : "text-muted"
                            }`}
                          >
                            {item.message}
                          </p>

                          <div className="d-flex align-items-center gap-2">

                            {unread ? (
                              <>
                                <i className="bi bi-circle-fill text-primary small"></i>

                                <small className="text-primary fw-semibold">
                                  Click to mark as read
                                </small>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check-circle-fill text-success"></i>

                                <small className="text-muted">
                                  Read
                                </small>
                              </>
                            )}

                          </div>

                        </div>

                        {readingId === item._id && (
                          <div className="spinner-border spinner-border-sm text-primary mt-2">
                            <span className="visually-hidden">
                              Updating...
                            </span>
                          </div>
                        )}

                      </div>
                    </button>
                  );
                })}

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Notifications;