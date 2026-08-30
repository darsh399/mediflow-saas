import { useEffect, useState } from "react";
import expenseApi from "../../api/expenseApi";
import { PageContainer, PageHeader, StatCard } from "../../components/ui";

const CATEGORIES = [
  { code: "TRAVEL", name: "Travel" },
  { code: "FOOD", name: "Food" },
  { code: "ACCOMMODATION", name: "Accommodation" },
  { code: "OFFICE_SUPPLIES", name: "Office Supplies" },
  { code: "CLIENT_ENTERTAINMENT", name: "Client Entertainment" },
  { code: "OTHER", name: "Other" },
];

const todayInput = () => new Date().toISOString().slice(0, 10);

const ApplyExpense = () => {
  const [form, setForm] = useState({
    category: "TRAVEL",
    amount: "",
    expenseDate: todayInput(),
    description: "",
  });
  const [receiptFile, setReceiptFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const response = await expenseApi.listMyExpenses();
      setExpenses(response.expenses || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to load expense history"
      );
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!form.expenseDate) {
      setError("Please select the expense date.");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("category", form.category);
      payload.append("amount", form.amount);
      payload.append("expenseDate", form.expenseDate);
      if (form.description.trim()) payload.append("description", form.description.trim());
      if (receiptFile) payload.append("receipt", receiptFile);
      await expenseApi.applyExpense(payload);

      setMessage("Expense claim submitted successfully.");
      setForm({ category: "TRAVEL", amount: "", expenseDate: todayInput(), description: "" });
      setReceiptFile(null);

      await loadExpenses();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to submit expense"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const categoryLabel = (code) => CATEGORIES.find((item) => item.code === code)?.name || code;

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

  const pendingCount = expenses.filter((item) => item.status === "pending").length;
  const approvedCount = expenses.filter((item) => item.status === "approved").length;

  return (
    <PageContainer>
      <PageHeader eyebrow="Expenses" title="Submit Expense" description="Submit an expense claim and track its approval status." />

      <div className="row g-3">
        <div className="col-6 col-md-3"><StatCard label="Pending" value={pendingCount} icon="bi-hourglass-split" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
        <div className="col-6 col-md-3"><StatCard label="Approved" value={approvedCount} icon="bi-check2-circle" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
      </div>

      <div className="container-fluid px-0">

        {/* ALERTS */}
        {message && (
          <div className="alert alert-success border-0 shadow-sm rounded-4 d-flex align-items-center gap-3">
            <i className="bi bi-check-circle-fill fs-4"></i>
            <div>
              <strong>Success</strong>
              <div className="small">{message}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4 d-flex align-items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill fs-4"></i>
            <div>
              <strong>Unable to process request</strong>
              <div className="small">{error}</div>
            </div>
          </div>
        )}

        {/* FORM */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-0 p-4">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px", backgroundColor: "var(--mf-color-primary-subtle)", color: "var(--mf-color-primary)" }}>
                <i className="bi bi-pencil-square fs-5"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1">New Expense Claim</h5>
                <p className="text-muted small mb-0">Fill in the details below to submit an expense.</p>
              </div>
            </div>
          </div>

          <div className="card-body p-4">
            <form onSubmit={submit}>
              <div className="row g-4">

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Expense For</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    {CATEGORIES.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Expense Date</label>
                  <input
                    type="date"
                    className="form-control"
                    max={todayInput()}
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(optional)</span></label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add any extra details about this expense..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Proof document <span className="text-muted fw-normal">(optional)</span></label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                  <div className="form-text">Upload a receipt or bill as a PDF or image up to 5 MB. Not required to submit.</div>
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-primary px-4 py-2 rounded-3" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Expense Claim
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>

        {/* RECENT EXPENSES */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 p-4">
            <h5 className="fw-bold mb-1">Recent Expense Claims</h5>
            <p className="text-muted small mb-0">Track the status of your submitted expenses.</p>
          </div>

          {loadingExpenses ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt text-muted fs-1"></i>
              <h5 className="fw-bold mt-3">No Expense Claims</h5>
              <p className="text-muted mb-0">You haven't submitted any expense claims yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                  <tr>
                    <th className="px-4 py-3 border-0">Expense For</th>
                    <th className="py-3 border-0">Amount</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0">Description</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="py-3 border-0">Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const statusStyle = getStatusStyle(expense.status);
                    return (
                      <tr key={expense._id}>
                        <td className="px-4 py-4">
                          <span className="fw-semibold">{categoryLabel(expense.category)}</span>
                        </td>
                        <td>{formatAmount(expense.amount)}</td>
                        <td>{formatDate(expense.expenseDate)}</td>
                        <td>
                          <span className="text-muted small">{expense.description || "-"}</span>
                        </td>
                        <td>
                          <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: statusStyle.backgroundColor, color: statusStyle.color }}>
                            <i className={`bi ${statusStyle.icon} me-1`}></i>
                            {expense.status || "pending"}
                          </span>
                        </td>
                        <td>
                          {expense.receipt?.url ? (
                            <a className="btn btn-sm btn-outline-primary" href={expense.receipt.url} target="_blank" rel="noreferrer">
                              <i className="bi bi-paperclip me-1"></i>View
                            </a>
                          ) : <span className="text-muted small">—</span>}
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

export default ApplyExpense;
