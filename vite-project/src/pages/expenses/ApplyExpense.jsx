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
const monthAgoInput = () => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

const ApplyExpense = () => {
  const [form, setForm] = useState({
    category: "TRAVEL",
    amount: "",
    expenseDate: todayInput(),
    description: "",
  });
  const [receiptFile, setReceiptFile] = useState(null);

  const [travelOpen, setTravelOpen] = useState(false);
  const [travelRange, setTravelRange] = useState({ from: monthAgoInput(), to: todayInput() });
  const [travelPreview, setTravelPreview] = useState(null);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelError, setTravelError] = useState("");

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

  const calculateTravel = async () => {
    try {
      setTravelLoading(true);
      setTravelError("");
      setTravelPreview(null);
      const preview = await expenseApi.previewTravelClaim(travelRange);
      setTravelPreview(preview);
    } catch (err) {
      setTravelError(err?.response?.data?.message || "Unable to calculate travel from visits");
    } finally {
      setTravelLoading(false);
    }
  };

  const useTravelAmount = () => {
    if (!travelPreview) return;
    const daNote = travelPreview.daAmount ? ` + DA ₹${travelPreview.daAmount}` : "";
    setForm((current) => ({
      ...current,
      category: "TRAVEL",
      amount: String(travelPreview.total),
      expenseDate: new Date(travelPreview.to).toISOString().slice(0, 10),
      description: `Travel claim ${travelRange.from} to ${travelRange.to}: ${travelPreview.totalKm} km over ${travelPreview.daysWithVisits} visit day(s) @ ₹${travelPreview.ratePerKm}/km${daNote}`,
    }));
    setMessage("Travel amount applied to the form below. Review and submit.");
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

        {/* TRAVEL FROM VISITS */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={() => setTravelOpen((open) => !open)}>
              <i className={`bi ${travelOpen ? "bi-chevron-down" : "bi-chevron-right"} me-1`}></i>
              Calculate travel from my visits
            </button>
            {travelOpen && (
              <div className="mt-3">
                <p className="text-muted small">Adds up the distance between your logged visit locations for the period. Home-to-first and last-to-home legs are not included.</p>
                <div className="row g-3 align-items-end">
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold">From</label>
                    <input type="date" className="form-control" max={travelRange.to} value={travelRange.from} onChange={(e) => setTravelRange((range) => ({ ...range, from: e.target.value }))} />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold">To</label>
                    <input type="date" className="form-control" max={todayInput()} value={travelRange.to} onChange={(e) => setTravelRange((range) => ({ ...range, to: e.target.value }))} />
                  </div>
                  <div className="col-sm-4">
                    <button type="button" className="btn btn-outline-primary rounded-3 w-100" disabled={travelLoading} onClick={calculateTravel}>
                      {travelLoading ? <span className="spinner-border spinner-border-sm"></span> : "Calculate"}
                    </button>
                  </div>
                </div>

                {travelError && <div className="alert alert-warning border-0 mt-3 mb-0">{travelError}</div>}

                {travelPreview && (
                  <div className="mt-3">
                    {travelPreview.ratePerKm === 0 && travelPreview.dailyAllowance === 0 && (
                      <div className="alert alert-info border-0">No travel rate is configured for your company yet — ask an admin to set it in Company Settings.</div>
                    )}
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-2">
                        <thead><tr className="text-muted small text-uppercase"><th>Date</th><th>Visits</th><th className="text-end">Distance (km)</th></tr></thead>
                        <tbody>
                          {travelPreview.days.map((day) => (
                            <tr key={day.date}><td>{formatDate(day.date)}</td><td>{day.visits}</td><td className="text-end">{day.km}</td></tr>
                          ))}
                          {travelPreview.days.length === 0 && <tr><td colSpan="3" className="text-muted">No visits with location data in this period.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                      <span className="small text-muted">
                        {travelPreview.totalKm} km · {formatAmount(travelPreview.travelAmount)} travel
                        {travelPreview.daAmount ? ` · ${formatAmount(travelPreview.daAmount)} DA` : ""}
                      </span>
                      <span className="fw-bold">Total {formatAmount(travelPreview.total)}</span>
                      <button type="button" className="btn btn-sm btn-primary rounded-3" disabled={!travelPreview.total} onClick={useTravelAmount}>
                        Use this amount
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
