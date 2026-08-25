import { useEffect, useState } from "react";
import auditLogApi from "../../api/auditLogApi";

const formatAction = (action) => {
  if (!action) return "-";
  return action.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getActionStyle = (action = "") => {
  if (/reject|delet|block|fail/i.test(action)) return { backgroundColor: "#fdecec", color: "#dc3545" };
  if (/approv|creat|activat|add/i.test(action)) return { backgroundColor: "#e8f8ef", color: "#198754" };
  return { backgroundColor: "#e5f0ff", color: "#0d6efd" };
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await auditLogApi.listAuditLogs({
        page,
        limit: 25,
        module: moduleFilter !== "all" ? moduleFilter : undefined,
        action: action.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(response.logs || []);
      setModules(response.modules || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  const clearFilters = () => {
    setModuleFilter("all");
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-body p-4 p-lg-5 text-white" style={{ background: "linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)" }}>
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <i className="bi bi-clock-history fs-3"></i>
              </div>
              <div>
                <span className="small opacity-75">SECURITY & COMPLIANCE</span>
                <h2 className="fw-bold mb-0">Audit Log</h2>
              </div>
            </div>
            <p className="mb-0 opacity-75 mt-3">A record of who did what and when across your company.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <form className="row g-3 align-items-end" onSubmit={applyFilters}>
              <div className="col-lg-3">
                <label className="form-label fw-semibold">Module</label>
                <select className="form-select" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                  <option value="all">All Modules</option>
                  {modules.map((mod) => <option value={mod} key={mod}>{formatAction(mod)}</option>)}
                </select>
              </div>
              <div className="col-lg-3">
                <label className="form-label fw-semibold">Action contains</label>
                <input className="form-control" placeholder="e.g. approved, deleted..." value={action} onChange={(e) => setAction(e.target.value)} />
              </div>
              <div className="col-lg-2">
                <label className="form-label fw-semibold">From</label>
                <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="col-lg-2">
                <label className="form-label fw-semibold">To</label>
                <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="col-lg-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1 rounded-3">Filter</button>
                <button type="button" className="btn btn-outline-secondary rounded-3" onClick={clearFilters}>
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 p-4">
            <h5 className="fw-bold mb-0">Activity</h5>
            <p className="text-muted small mb-0">{pagination.total ?? 0} events recorded</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted fs-1"></i>
              <h6 className="fw-bold mt-3">No activity found</h6>
              <p className="text-muted mb-0">No audit events match your filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8f9fc" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">When</th>
                    <th className="py-3 border-0">Actor</th>
                    <th className="py-3 border-0">Action</th>
                    <th className="py-3 border-0">Module</th>
                    <th className="py-3 border-0">Target</th>
                    <th className="py-3 border-0"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const style = getActionStyle(log.action);
                    return (
                      <tr key={log._id}>
                        <td className="px-4 py-3 small">{formatDate(log.createdAt)}</td>
                        <td className="py-3">
                          <div className="fw-semibold">{log.actorId?.name || "System"}</div>
                          <small className="text-muted text-capitalize">{(log.actorRole || "").replace(/_/g, " ")}</small>
                        </td>
                        <td className="py-3">
                          <span className="badge rounded-pill px-3 py-2" style={style}>{formatAction(log.action)}</span>
                        </td>
                        <td className="py-3 text-capitalize">{log.module || "-"}</td>
                        <td className="py-3">{log.targetUserId?.name || "-"}</td>
                        <td className="py-3 pe-4 text-end">
                          {(log.oldValue || log.newValue) && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelected(log)}>
                              Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-4 border-top">
              <small className="text-muted">Page {pagination.page} of {pagination.totalPages}</small>
              <div className="btn-group">
                <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button className="btn btn-outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {selected && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{formatAction(selected.action)}</h5>
                <button type="button" className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {selected.oldValue && (
                    <div className="col-md-6">
                      <div className="text-muted small fw-semibold text-uppercase mb-1">Before</div>
                      <pre className="bg-light p-3 rounded small mb-0" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(selected.oldValue, null, 2)}</pre>
                    </div>
                  )}
                  {selected.newValue && (
                    <div className="col-md-6">
                      <div className="text-muted small fw-semibold text-uppercase mb-1">After</div>
                      <pre className="bg-light p-3 rounded small mb-0" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(selected.newValue, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
