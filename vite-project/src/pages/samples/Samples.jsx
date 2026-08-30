import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import sampleApi from "../../api/sampleApi";
import userApi from "../../api/userApi";
import doctorApi from "../../api/doctorApi";
import companyProductApi from "../../api/companyProductApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader, StatCard, AppModal, Badge } from "../../components/ui";

const MANAGER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const UNIT_OPTIONS = ["unit", "box", "strip", "pack", "piece", "bottle", "vial", "tube", "sachet", "kit"];
const errText = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");

export default function Samples() {
  const role = useSelector((state) => state.auth.user?.role);
  const isManager = MANAGER_ROLES.includes(role);
  const { notify } = useNotify();

  const [tab, setTab] = useState("balances");
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [reps, setReps] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [move, setMove] = useState(null); // { row, type: 'given'|'return' }
  const [itemForm, setItemForm] = useState(null); // null | {} | item
  const [issue, setIssue] = useState({ employeeId: "", pick: "", itemName: "", kind: "SAMPLE", unit: "unit", quantity: "", note: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bal, txns, itemList] = await Promise.all([
        sampleApi.getBalances(),
        sampleApi.listTransactions(),
        sampleApi.listItems(),
      ]);
      setBalances(bal.balances || []);
      setTransactions(txns.transactions || []);
      setItems(itemList.items || []);
      const docList = await doctorApi.listDoctors().catch(() => ({ doctors: [] }));
      setDoctors(docList.doctors || []);
      if (isManager) {
        const [repList, productList] = await Promise.all([
          userApi.listUsers().catch(() => ({ users: [] })),
          companyProductApi.listProducts().catch(() => ({ products: [] })),
        ]);
        setReps((repList.users || []).filter((user) => user.active !== false));
        setProducts((productList.products || []).filter((product) => product.name));
      }
    } catch (err) {
      setError(errText(err, "Unable to load sample stock"));
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  const myUserId = useSelector((state) => state.auth.user?._id || state.auth.user?.id);
  const activeItems = useMemo(() => items.filter((item) => item.active), [items]);
  const itemNameSet = useMemo(() => new Set(activeItems.map((item) => item.name.toLowerCase())), [activeItems]);
  const productOptions = useMemo(
    () => products.filter((product) => !itemNameSet.has(product.name.toLowerCase())),
    [products, itemNameSet]
  );
  const issueNeedsName = issue.pick === "custom";
  const totalInHand = balances.reduce((sum, row) => sum + (row.balance || 0), 0);
  const lowRows = balances.filter((row) => row.balance <= 5).length;

  const submitMove = async (event) => {
    event.preventDefault();
    const form = event.target;
    const quantity = Number(form.quantity.value);
    if (!quantity || quantity <= 0) return;
    try {
      setBusy(true);
      const payload = { itemId: move.row.itemId, quantity, note: form.note.value.trim() || undefined };
      if (isManager && move.row.employeeId !== myUserId) payload.employeeId = move.row.employeeId;
      if (move.type === "given") {
        payload.doctorId = form.doctorId.value || undefined;
        await sampleApi.recordGiven(payload);
      } else {
        await sampleApi.recordReturn(payload);
      }
      notify(move.type === "given" ? "Recorded as given" : "Returned to stock");
      setMove(null);
      await load();
    } catch (err) {
      notify(errText(err, "Unable to record movement"), "", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitIssue = async (event) => {
    event.preventDefault();
    if (!issue.employeeId || !issue.pick || !Number(issue.quantity)) return;
    const payload = { employeeId: issue.employeeId, quantity: Number(issue.quantity), note: issue.note.trim() || undefined };
    if (issue.pick === "custom" || issue.pick.startsWith("new:")) {
      const name = issue.pick.startsWith("new:") ? issue.pick.slice(4) : issue.itemName.trim();
      if (!name) return;
      payload.itemName = name;
      payload.kind = issue.kind;
      payload.unit = issue.unit || "unit";
    } else {
      payload.itemId = issue.pick;
    }
    try {
      setBusy(true);
      await sampleApi.issueStock(payload);
      notify("Stock issued");
      setIssue({ employeeId: "", pick: "", itemName: "", kind: "SAMPLE", unit: "unit", quantity: "", note: "" });
      await load();
    } catch (err) {
      notify(errText(err, "Unable to issue stock"), "", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitItem = async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
      name: form.name.value.trim(),
      kind: form.kind.value,
      unit: form.unit.value.trim() || "unit",
      active: form.active.checked,
    };
    if (!payload.name) return;
    try {
      setBusy(true);
      if (itemForm?._id) await sampleApi.updateItem(itemForm._id, payload);
      else await sampleApi.createItem(payload);
      notify("Item saved");
      setItemForm(null);
      await load();
    } catch (err) {
      notify(errText(err, "Unable to save item"), "", "error");
    } finally {
      setBusy(false);
    }
  };

  const TABS = [
    ["balances", isManager ? "Team Balances" : "My Stock"],
    ["activity", "Activity"],
    ...(isManager ? [["issue", "Issue Stock"], ["items", "Items"]] : []),
  ];

  return (
    <PageContainer>
      <datalist id="sample-units">
        {UNIT_OPTIONS.map((option) => <option key={option} value={option} />)}
      </datalist>
      <PageHeader eyebrow="Field" title="Samples & Gifts" description="Track sample and gift stock in reps' hands and what they leave with doctors." />

      <div className="row g-3">
        <div className="col-6 col-lg-3"><StatCard label="Units in hand" value={totalInHand} icon="bi-box-seam" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Low / empty lines" value={lowRows} icon="bi-exclamation-triangle" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Catalogue items" value={activeItems.length} icon="bi-tags" /></div>
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm rounded-4 mt-3">{error}</div>}

      <div className="card border-0 shadow-sm rounded-4 mt-3">
        <div className="card-body p-3 p-md-4">
          <ul className="nav nav-pills gap-2 mb-3">
            {TABS.map(([value, label]) => (
              <li className="nav-item" key={value}>
                <button type="button" className={`nav-link ${tab === value ? "active" : ""}`} onClick={() => setTab(value)}>{label}</button>
              </li>
            ))}
          </ul>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
          ) : tab === "balances" ? (
            balances.length ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="border-bottom">
                      {isManager && <th className="py-2 text-muted small text-uppercase">Rep</th>}
                      <th className="py-2 text-muted small text-uppercase">Item</th>
                      <th className="py-2 text-muted small text-uppercase">Kind</th>
                      <th className="py-2 text-muted small text-uppercase">In hand</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((row) => {
                      const mine = row.employeeId === myUserId;
                      return (
                        <tr key={`${row.employeeId}-${row.itemId}`}>
                          {isManager && <td className="py-2">{row.employee?.name || "—"}</td>}
                          <td className="py-2 fw-semibold">{row.item?.name || "—"}</td>
                          <td className="py-2"><span className="badge text-bg-light text-capitalize">{(row.item?.kind || "").toLowerCase()}</span></td>
                          <td className={`py-2 fw-semibold ${row.balance <= 0 ? "text-danger" : row.balance <= 5 ? "text-warning" : ""}`}>{row.balance} {row.item?.unit || ""}</td>
                          <td className="py-2 text-end">
                            {(mine || isManager) && row.balance > 0 && (
                              <div className="btn-group btn-group-sm">
                                <button type="button" className="btn btn-outline-primary rounded-start-3" onClick={() => setMove({ row, type: "given" })}>Give</button>
                                <button type="button" className="btn btn-outline-secondary rounded-end-3" onClick={() => setMove({ row, type: "return" })}>Return</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted mb-0">No stock on hand yet.</p>
          ) : tab === "activity" ? (
            transactions.length ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="border-bottom">
                      <th className="py-2 text-muted small text-uppercase">Date</th>
                      {isManager && <th className="py-2 text-muted small text-uppercase">Rep</th>}
                      <th className="py-2 text-muted small text-uppercase">Item</th>
                      <th className="py-2 text-muted small text-uppercase">Type</th>
                      <th className="py-2 text-muted small text-uppercase">Qty</th>
                      <th className="py-2 text-muted small text-uppercase">Doctor / note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn._id}>
                        <td className="py-2">{fmtDate(txn.occurredAt)}</td>
                        {isManager && <td className="py-2">{txn.employeeId?.name || "—"}</td>}
                        <td className="py-2 fw-semibold">{txn.itemId?.name || "—"}</td>
                        <td className="py-2"><Badge status={txn.type === "GIVEN" ? "completed" : txn.type === "ISSUE" ? "info" : txn.type === "RETURN" ? "pending" : "draft"}>{txn.type}</Badge></td>
                        <td className="py-2">{txn.quantity}</td>
                        <td className="py-2"><span className="text-muted small">{txn.doctorId?.name || txn.note || "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted mb-0">No activity yet.</p>
          ) : tab === "issue" ? (
            <form className="row g-3" onSubmit={submitIssue} style={{ maxWidth: 520 }}>
              <div className="col-12">
                <label className="form-label fw-semibold">Rep</label>
                <select className="form-select" required value={issue.employeeId} onChange={(e) => setIssue((f) => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Select a rep…</option>
                  {reps.map((rep) => <option key={rep._id} value={rep._id}>{rep.name} — {String(rep.role || "").replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="col-sm-8">
                <label className="form-label fw-semibold">Item</label>
                <select className="form-select" required value={issue.pick} onChange={(e) => setIssue((f) => ({ ...f, pick: e.target.value }))}>
                  <option value="">Select an item…</option>
                  {activeItems.length > 0 && (
                    <optgroup label="Your items">
                      {activeItems.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.kind.toLowerCase()})</option>)}
                    </optgroup>
                  )}
                  {productOptions.length > 0 && (
                    <optgroup label="Products">
                      {productOptions.map((product) => <option key={product._id} value={`new:${product.name}`}>{product.name}</option>)}
                    </optgroup>
                  )}
                  <option value="custom">+ Custom item…</option>
                </select>
              </div>
              <div className="col-sm-4">
                <label className="form-label fw-semibold">Quantity</label>
                <input type="number" min="1" className="form-control" required value={issue.quantity} onChange={(e) => setIssue((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              {issueNeedsName && (
                <>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">Item name</label>
                    <input className="form-control" required value={issue.itemName} onChange={(e) => setIssue((f) => ({ ...f, itemName: e.target.value }))} />
                  </div>
                  <div className="col-sm-3">
                    <label className="form-label fw-semibold">Kind</label>
                    <select className="form-select" value={issue.kind} onChange={(e) => setIssue((f) => ({ ...f, kind: e.target.value }))}>
                      <option value="SAMPLE">Sample</option>
                      <option value="GIFT">Gift</option>
                    </select>
                  </div>
                  <div className="col-sm-3">
                    <label className="form-label fw-semibold">Unit</label>
                    <input className="form-control" list="sample-units" value={issue.unit} onChange={(e) => setIssue((f) => ({ ...f, unit: e.target.value }))} />
                  </div>
                </>
              )}
              <div className="col-12">
                <label className="form-label fw-semibold">Note</label>
                <input className="form-control" value={issue.note} onChange={(e) => setIssue((f) => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary rounded-3" disabled={busy}>{busy ? "Issuing…" : "Issue stock"}</button>
              </div>
            </form>
          ) : (
            <>
              <button type="button" className="btn btn-primary rounded-3 mb-3" onClick={() => setItemForm({})}>
                <i className="bi bi-plus-lg me-1"></i>Add item
              </button>
              {items.length ? (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead><tr className="border-bottom"><th className="py-2 text-muted small text-uppercase">Name</th><th className="py-2 text-muted small text-uppercase">Kind</th><th className="py-2 text-muted small text-uppercase">Unit</th><th className="py-2 text-muted small text-uppercase">Status</th><th className="py-2"></th></tr></thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item._id}>
                          <td className="py-2 fw-semibold">{item.name}</td>
                          <td className="py-2 text-capitalize">{item.kind.toLowerCase()}</td>
                          <td className="py-2">{item.unit}</td>
                          <td className="py-2">{item.active ? <span className="badge text-bg-success">Active</span> : <span className="badge text-bg-secondary">Inactive</span>}</td>
                          <td className="py-2 text-end"><button type="button" className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => setItemForm(item)}>Edit</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-muted mb-0">No items in the catalogue yet.</p>}
            </>
          )}
        </div>
      </div>

      {move && (
        <AppModal
          title={move.type === "given" ? `Give ${move.row.item?.name}` : `Return ${move.row.item?.name}`}
          subtitle={`${move.row.balance} ${move.row.item?.unit || ""} in hand`}
          onClose={() => (busy ? null : setMove(null))}
        >
          <form onSubmit={submitMove}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Quantity</label>
              <input name="quantity" type="number" min="1" max={move.row.balance} className="form-control" required />
            </div>
            {move.type === "given" && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Doctor <span className="text-muted fw-normal">(optional)</span></label>
                <select name="doctorId" className="form-select">
                  <option value="">Not linked to a doctor</option>
                  {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}
                </select>
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-semibold">Note</label>
              <input name="note" className="form-control" />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary rounded-3" disabled={busy} onClick={() => setMove(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-3" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </AppModal>
      )}

      {itemForm && (
        <AppModal title={itemForm._id ? "Edit item" : "Add item"} onClose={() => (busy ? null : setItemForm(null))}>
          <form onSubmit={submitItem}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Name</label>
              <input name="name" className="form-control" defaultValue={itemForm.name || ""} required />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold">Kind</label>
                <select name="kind" className="form-select" defaultValue={itemForm.kind || "SAMPLE"}>
                  <option value="SAMPLE">Sample</option>
                  <option value="GIFT">Gift</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Unit</label>
                <input name="unit" className="form-control" list="sample-units" defaultValue={itemForm.unit || "unit"} />
              </div>
            </div>
            <div className="form-check mb-3">
              <input name="active" className="form-check-input" type="checkbox" defaultChecked={itemForm._id ? itemForm.active : true} id="sample-item-active" />
              <label className="form-check-label" htmlFor="sample-item-active">Active</label>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary rounded-3" disabled={busy} onClick={() => setItemForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-3" disabled={busy}>{busy ? "Saving…" : "Save item"}</button>
            </div>
          </form>
        </AppModal>
      )}
    </PageContainer>
  );
}
