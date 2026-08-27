import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import saleApi from "../../api/saleApi";
import doctorApi from "../../api/doctorApi";
import productApi from "../../api/productApi";
import userApi from "../../api/userApi";
import { useNotify } from "../../components/NotificationProvider";
import { MANAGER_ROLES, money, errorMessage, monthLabel, recentMonths, fmtDate } from "./salesShared";

const todayInput = () => new Date().toISOString().slice(0, 10);

const SalesTab = ({ role, period, setPeriod }) => {
  const { notify } = useNotify();
  const currentUserId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  const isManager = MANAGER_ROLES.includes(role);
  const months = useMemo(() => recentMonths(), []);

  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await saleApi.listSales({
        month: period.month,
        year: period.year,
        ...(employeeFilter ? { employeeId: employeeFilter } : {}),
      });
      setSales(response.sales || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(errorMessage(err, "Unable to load sales"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, employeeFilter]);

  useEffect(() => {
    doctorApi.listDoctors().then((r) => setDoctors(r.doctors || [])).catch(() => setDoctors([]));
    productApi.listProducts().then((r) => setProducts(r.products || r || [])).catch(() => setProducts([]));
    if (isManager) userApi.listUsers().then((r) => setEmployees((r.users || []).filter((u) => u.active !== false))).catch(() => setEmployees([]));
  }, [isManager]);

  const openForm = () => {
    setForm({ doctorId: "", productId: "", amount: "", quantity: "1", saleDate: todayInput(), notes: "", employeeId: "" });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saleApi.createSale({
        doctorId: form.doctorId || undefined,
        productId: form.productId || undefined,
        amount: Number(form.amount) || 0,
        quantity: Number(form.quantity) || 1,
        saleDate: form.saleDate,
        notes: form.notes.trim() || undefined,
        ...(isManager && form.employeeId ? { employeeId: form.employeeId } : {}),
      });
      notify("Sale recorded");
      setForm(null);
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to record sale"), "", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeSale = async (sale) => {
    if (!window.confirm(`Remove this ${money(sale.amount)} sale?`)) return;
    try {
      await saleApi.deleteSale(sale._id);
      notify("Sale removed");
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to remove sale"), "", "error");
    }
  };

  return (
    <div>
      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3 d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="form-label small fw-semibold mb-1">Month</label>
            <select
              className="form-select form-select-sm"
              value={`${period.year}-${period.month}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-").map(Number);
                setPeriod({ month, year });
              }}
            >
              {months.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{monthLabel(m.month, m.year)}</option>
              ))}
            </select>
          </div>
          {isManager && (
            <div>
              <label className="form-label small fw-semibold mb-1">Employee</label>
              <select className="form-select form-select-sm" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
                <option value="">All</option>
                {employees.map((emp) => <option value={emp._id} key={emp._id}>{emp.name}</option>)}
              </select>
            </div>
          )}
          <div className="ms-auto d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="small text-muted">Total this view</div>
              <div className="fw-bold">{money(total)}</div>
            </div>
            <button type="button" className="btn btn-sm btn-primary" onClick={openForm}>
              <i className="bi bi-plus-lg me-1"></i>Record Sale
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm rounded-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : sales.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-cash-stack fs-1 d-block mb-2 text-primary"></i>
            No sales recorded for {monthLabel(period.month, period.year)}.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: "#f8f9fc" }}>
                <tr>
                  <th className="px-4 py-3 border-0">Date</th>
                  {isManager && <th className="py-3 border-0">Rep</th>}
                  <th className="py-3 border-0">Doctor</th>
                  <th className="py-3 border-0">Product</th>
                  <th className="py-3 border-0">Qty</th>
                  <th className="py-3 border-0">Amount</th>
                  <th className="py-3 border-0 pe-4"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="px-4 py-3">{fmtDate(sale.saleDate)}</td>
                    {isManager && <td className="py-3">{sale.employeeId?.name || "—"}</td>}
                    <td className="py-3">{sale.doctorId?.name || "—"}</td>
                    <td className="py-3">{sale.productId?.name || "—"}</td>
                    <td className="py-3">{sale.quantity}</td>
                    <td className="py-3 fw-semibold">{money(sale.amount)}</td>
                    <td className="py-3 pe-4 text-end">
                      {(String(sale.employeeId?._id || sale.employeeId) === String(currentUserId) || isManager) && (
                        <button type="button" className="btn btn-sm btn-light border text-danger" onClick={() => removeSale(sale)} aria-label="Remove sale">
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,.45)" }} onClick={() => setForm(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4">
              <form onSubmit={submitForm}>
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">Record a sale</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setForm(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    {isManager && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">Rep <span className="text-muted fw-normal">(defaults to you)</span></label>
                        <select className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                          <option value="">Myself</option>
                          {employees.map((emp) => <option value={emp._id} key={emp._id}>{emp.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="col-md-7">
                      <label className="form-label fw-semibold">Doctor</label>
                      <select className="form-select" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                        <option value="">— none —</option>
                        {doctors.map((doctor) => <option value={doctor._id} key={doctor._id}>{doctor.name}{doctor.clinicName ? ` (${doctor.clinicName})` : ""}</option>)}
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Product / service</label>
                      <select className="form-select" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                        <option value="">— none —</option>
                        {products.map((product) => <option value={product._id} key={product._id}>{product.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Amount (₹)</label>
                      <input required type="number" min="0" step="1" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Quantity</label>
                      <input type="number" min="1" className="form-control" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Sale date</label>
                      <input required type="date" max={todayInput()} className="form-control" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Notes <span className="text-muted fw-normal">(optional)</span></label>
                      <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light border" onClick={() => setForm(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Record sale"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTab;
