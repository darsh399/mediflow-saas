import { useEffect, useMemo, useState } from "react";
import expenseApi from "../../api/expenseApi";
import { downloadBlob } from "../../utils/downloadBlob";
import { PageContainer, PageHeader, StatCard, SkeletonTable } from "../../components/ui";

const CATEGORY_LABELS = {
  TRAVEL: "Travel",
  FOOD: "Food",
  ACCOMMODATION: "Accommodation",
  OFFICE_SUPPLIES: "Office Supplies",
  CLIENT_ENTERTAINMENT: "Client Entertainment",
  OTHER: "Other",
};

const monthKeyOf = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabelOf = (key) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await expenseApi.listExpenses();
      setExpenses(response.expenses || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to load expense claims"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatAmount = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const getEmployeeName = (expense) => expense.employeeId?.name || "Unknown Employee";
  const getEmployeeEmail = (expense) => expense.employeeId?.email || "";

  const monthOptions = useMemo(() => {
    const byMonth = new Map();
    expenses.forEach((expense) => {
      const key = monthKeyOf(expense.expenseDate || expense.createdAt);
      if (!key) return;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    });
    return Array.from(byMonth.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, count]) => ({ key, count, label: monthLabelOf(key) }));
  }, [expenses]);

  const monthFilteredExpenses = useMemo(() => {
    if (!selectedMonth) return expenses;
    return expenses.filter((expense) => monthKeyOf(expense.expenseDate || expense.createdAt) === selectedMonth);
  }, [expenses, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return monthFilteredExpenses.filter((expense) => {
      const employeeName = getEmployeeName(expense).toLowerCase();
      const employeeEmail = getEmployeeEmail(expense).toLowerCase();
      const category = String(expense.category || "").toLowerCase();
      const description = String(expense.description || "").toLowerCase();
      const status = String(expense.status || "pending").toLowerCase();

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeEmail.includes(searchValue) ||
        category.includes(searchValue) ||
        description.includes(searchValue);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [monthFilteredExpenses, search, statusFilter]);

  const employeeSummary = useMemo(() => {
    const byEmployee = new Map();
    monthFilteredExpenses.forEach((expense) => {
      const id = expense.employeeId?._id || expense.employeeId || "unknown";
      if (!byEmployee.has(id)) {
        byEmployee.set(id, {
          id,
          name: getEmployeeName(expense),
          email: getEmployeeEmail(expense),
          count: 0,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        });
      }
      const entry = byEmployee.get(id);
      const amount = Number(expense.amount || 0);
      const status = String(expense.status || "pending").toLowerCase();
      entry.count += 1;
      entry.total += amount;
      if (status === "approved") entry.approved += amount;
      else if (status === "rejected") entry.rejected += amount;
      else entry.pending += amount;
    });
    return Array.from(byEmployee.values()).sort((a, b) => b.total - a.total);
  }, [monthFilteredExpenses]);

  const review = async (id, action) => {
    try {
      setReviewingId(id);
      setError("");
      setSuccess("");

      const reviewNote = window.prompt(action === "reject" ? "Reason for rejection:" : "Approval comment (optional):", "");
      if (action === "reject" && !reviewNote?.trim()) return;
      await expenseApi.reviewExpense(id, { action, reviewNote: reviewNote?.trim() || "" });

      setSuccess(`Expense ${action === "approve" ? "approved" : "rejected"} successfully.`);
      await loadExpenses();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update expense");
    } finally {
      setReviewingId(null);
    }
  };

  const exportCsv = async () => {
    try {
      setExporting(true);
      const blob = await expenseApi.exportExpenses(statusFilter !== "all" ? { status: statusFilter } : {});
      downloadBlob(blob, "expense-claims.csv");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to export expense claims");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSelectedMonth("");
  };

  const pending = expenses.filter((expense) => expense.status === "pending").length;
  const approved = expenses.filter((expense) => expense.status === "approved").length;
  const rejected = expenses.filter((expense) => expense.status === "rejected").length;
  const totalApproved = expenses.filter((expense) => expense.status === "approved").reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const getStatusStyle = (status) => {
    switch (String(status).toLowerCase()) {
      case "approved":
        return { backgroundColor: "#e8f8ef", color: "#198754", icon: "bi-check-circle-fill" };
      case "rejected":
        return { backgroundColor: "#fdecec", color: "#dc3545", icon: "bi-x-circle-fill" };
      default:
        return { backgroundColor: "#fff4e5", color: "#fd7e14", icon: "bi-clock-fill" };
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader eyebrow="Expenses" title="Review Expenses" description="Review and approve expense claims submitted by your team." />
        <SkeletonTable rows={8} columns={5} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="Expenses" title="Review Expenses" description="Review and approve expense claims submitted by your team." />

      <div className="row g-3">
        <div className="col-4"><StatCard label="Pending" value={pending} icon="bi-hourglass-split" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
        <div className="col-4"><StatCard label="Approved" value={approved} icon="bi-check2-circle" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
        <div className="col-4"><StatCard label="Rejected" value={rejected} icon="bi-x-circle" iconBg="var(--mf-color-danger-subtle)" iconColor="var(--mf-color-danger)" /></div>
      </div>

      <div className="container-fluid px-0">

        {success && (
          <div className="alert alert-success border-0 shadow-sm rounded-4">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </div>
        )}

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <p className="text-muted small mb-1">Total approved this view</p>
              <h4 className="fw-bold mb-0">{formatAmount(totalApproved)}</h4>
            </div>
          </div>
        </div>

        {/* MONTH SELECTOR */}
        {monthOptions.length > 0 && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <label className="form-label fw-semibold mb-2">Filter by Month</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 ${selectedMonth === "" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setSelectedMonth("")}
                >
                  All Time
                </button>
                {monthOptions.map((month) => (
                  <button
                    key={month.key}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 ${selectedMonth === month.key ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setSelectedMonth(month.key)}
                  >
                    {month.label} <span className="opacity-75">({month.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXPENSE BY EMPLOYEE */}
        {employeeSummary.length > 0 && (
          <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-1">
                Expense Totals by Employee
                {selectedMonth && <span className="text-primary"> — {monthLabelOf(selectedMonth)}</span>}
              </h5>
              <p className="text-muted small mb-0">
                {selectedMonth
                  ? `Breakdown of claimed amounts per employee for ${monthLabelOf(selectedMonth)}.`
                  : "Breakdown of claimed amounts per employee, across all claims. Pick a month above to narrow it down."}
              </p>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Employee</th>
                    <th className="py-3 border-0">Claims</th>
                    <th className="py-3 border-0">Approved</th>
                    <th className="py-3 border-0">Pending</th>
                    <th className="py-3 border-0">Rejected</th>
                    <th className="py-3 border-0 pe-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeSummary.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3">
                        <div className="fw-bold">{entry.name}</div>
                        <small className="text-muted">{entry.email}</small>
                      </td>
                      <td className="py-3">{entry.count}</td>
                      <td className="py-3 text-success fw-semibold">{formatAmount(entry.approved)}</td>
                      <td className="py-3 text-warning fw-semibold">{formatAmount(entry.pending)}</td>
                      <td className="py-3 text-danger fw-semibold">{formatAmount(entry.rejected)}</td>
                      <td className="py-3 pe-4 fw-bold">{formatAmount(entry.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">

              <div className="col-lg-7">
                <label className="form-label fw-semibold">Search Employee or Category</label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee name, email or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-lg-3">
                <label className="form-label fw-semibold">Status</label>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="col-lg-2">
                <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                  <i className="bi bi-x-circle me-2"></i>
                  Clear
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1">Expense Claims</h5>
                <p className="text-muted small mb-0">
                  Showing {filteredExpenses.length} of {monthFilteredExpenses.length} claims
                  {selectedMonth ? ` for ${monthLabelOf(selectedMonth)}` : ""}
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-3" disabled={exporting} onClick={exportCsv}>
                  {exporting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-download me-2"></i>}
                  Export CSV
                </button>
                <span className="badge bg-primary rounded-pill px-3 py-2">{pending} Pending</span>
              </div>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt text-primary fs-1"></i>
              <h5 className="fw-bold mt-3">No Expense Claims Found</h5>
              <p className="text-muted">No expense claims match your filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Employee</th>
                    <th className="py-3 border-0">Expense For</th>
                    <th className="py-3 border-0">Amount</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0">Description</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="py-3 border-0">Proof</th>
                    <th className="py-3 border-0 pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => {
                    const statusStyle = getStatusStyle(expense.status);
                    const isPending = expense.status === "pending";

                    return (
                      <tr key={expense._id}>
                        <td className="px-4 py-4">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: "40px", height: "40px", background: "var(--mf-color-primary-subtle)", color: "var(--mf-color-primary)" }}
                            >
                              <i className="bi bi-person-fill"></i>
                            </div>
                            <div>
                              <div className="fw-bold">{getEmployeeName(expense)}</div>
                              <small className="text-muted">{getEmployeeEmail(expense)}</small>
                            </div>
                          </div>
                        </td>

                        <td className="py-4">
                          <span className="fw-semibold">{CATEGORY_LABELS[expense.category] || expense.category}</span>
                        </td>

                        <td className="py-4">{formatAmount(expense.amount)}</td>

                        <td className="py-4">{formatDate(expense.expenseDate)}</td>

                        <td className="py-4">
                          <div className="text-muted small" style={{ maxWidth: "220px" }}>
                            {expense.description || "-"}
                          </div>
                        </td>

                        <td className="py-4">
                          <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: statusStyle.backgroundColor, color: statusStyle.color }}>
                            <i className={`bi ${statusStyle.icon} me-1`}></i>
                            {expense.status || "Pending"}
                          </span>
                        </td>

                        <td className="py-4">
                          {expense.receipt?.url ? (
                            <a className="btn btn-sm btn-outline-primary" href={expense.receipt.url} target="_blank" rel="noreferrer">
                              <i className="bi bi-paperclip me-1"></i>View
                            </a>
                          ) : <span className="text-muted small">—</span>}
                        </td>

                        <td className="py-4 pe-4">
                          {isPending ? (
                            <div className="d-flex flex-column flex-xl-row gap-2">
                              <button
                                className="btn btn-success btn-sm rounded-3"
                                disabled={reviewingId === expense._id}
                                onClick={() => review(expense._id, "approve")}
                              >
                                {reviewingId === expense._id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <>
                                    <i className="bi bi-check-lg me-1"></i>
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm rounded-3"
                                disabled={reviewingId === expense._id}
                                onClick={() => review(expense._id, "reject")}
                              >
                                <i className="bi bi-x-lg me-1"></i>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">Already reviewed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
};

export default ExpenseManagement;
