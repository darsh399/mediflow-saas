import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import territoryApi from "../../api/territoryApi";
import userApi from "../../api/userApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader, StatCard, SkeletonTable } from "../../components/ui";

const MANAGE_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const emptyForm = { name: "", code: "", description: "", managerId: "", memberIds: [], areaTags: "" };

const Territories = () => {
  const { notify } = useNotify();
  const role = useSelector((state) => state.auth.user?.role);
  const canManage = MANAGE_ROLES.includes(role);

  const [territories, setTerritories] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null | "new" | territory object
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await territoryApi.listTerritories();
      setTerritories(response.territories || []);
    } catch (err) {
      setError(errorMessage(err, "Unable to load territories"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!canManage) return;
    userApi
      .listUsers()
      .then((response) => setColleagues((response.users || []).filter((user) => user.active !== false)))
      .catch(() => setColleagues([]));
  }, [canManage]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing("new");
  };

  const openEdit = (territory) => {
    setForm({
      name: territory.name || "",
      code: territory.code || "",
      description: territory.description || "",
      managerId: territory.managerId?._id || "",
      memberIds: (territory.memberIds || []).map((member) => member._id),
      areaTags: (territory.areaTags || []).join(", "),
    });
    setEditing(territory);
  };

  const closeModal = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        managerId: form.managerId || null,
        memberIds: form.memberIds,
        areaTags: form.areaTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };
      if (editing === "new") {
        await territoryApi.createTerritory(payload);
        notify("Territory created");
      } else {
        await territoryApi.updateTerritory(editing._id, payload);
        notify("Territory updated");
      }
      closeModal();
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to save territory"), "", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (territory) => {
    if (!window.confirm(`Remove "${territory.name}"? Its doctors and chemists will be left unassigned.`)) return;
    try {
      await territoryApi.deleteTerritory(territory._id);
      notify("Territory removed");
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to remove territory"), "", "error");
    }
  };

  const toggleMember = (id) => {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(id)
        ? current.memberIds.filter((memberId) => memberId !== id)
        : [...current.memberIds, id],
    }));
  };

  const totals = useMemo(
    () => ({
      territories: territories.length,
      doctors: territories.reduce((sum, territory) => sum + (territory.doctorCount || 0), 0),
      medicals: territories.reduce((sum, territory) => sum + (territory.medicalCount || 0), 0),
    }),
    [territories]
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Field"
        title="Territories"
        description="Group doctors and chemists by area, and assign the reps who cover them."
        actions={canManage && (
          <button type="button" className="btn btn-primary rounded-3 fw-semibold" onClick={openCreate}>
            <i className="bi bi-plus-lg me-2"></i> New Territory
          </button>
        )}
      />

      <div className="row g-3">
        <div className="col-4"><StatCard label="Territories" value={totals.territories} icon="bi-geo" /></div>
        <div className="col-4"><StatCard label="Doctors" value={totals.doctors} icon="bi-heart-pulse" iconBg="var(--mf-color-info-subtle)" iconColor="var(--mf-color-info)" /></div>
        <div className="col-4"><StatCard label="Chemists" value={totals.medicals} icon="bi-shop" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
      </div>

      <div className="container-fluid px-0">

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {loading ? (
          <SkeletonTable rows={6} columns={4} />
        ) : territories.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <i className="bi bi-geo text-primary fs-1"></i>
              <h5 className="fw-bold mt-3">No territories yet</h5>
              <p className="text-muted mb-0">
                {canManage ? "Create a territory, then assign doctors and chemists to it." : "No territories have been set up."}
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {territories.map((territory) => (
              <div className="col-md-6 col-xl-4" key={territory._id}>
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <Link to={`/territories/${territory._id}`} className="fw-bold fs-5 text-decoration-none text-dark">
                          {territory.name}
                        </Link>
                        {territory.code && <span className="badge text-bg-light border ms-2">{territory.code}</span>}
                      </div>
                      {canManage && (
                        <div className="d-flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            aria-label="Edit territory"
                            onClick={() => openEdit(territory)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border text-danger"
                            aria-label="Remove territory"
                            onClick={() => remove(territory)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    {territory.description && (
                      <p className="text-muted small mb-3">{territory.description}</p>
                    )}

                    <div className="small text-muted mb-1">
                      <i className="bi bi-person-badge me-1"></i>
                      Manager: <span className="text-dark">{territory.managerId?.name || "Not set"}</span>
                    </div>
                    <div className="small text-muted mb-3">
                      <i className="bi bi-people me-1"></i>
                      {territory.memberCount} {territory.memberCount === 1 ? "rep" : "reps"} assigned
                    </div>

                    {(territory.areaTags || []).length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {territory.areaTags.map((tag) => (
                          <span key={tag} className="badge rounded-pill text-bg-light border fw-normal">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto d-flex gap-3 pt-3 border-top">
                      <div>
                        <div className="fw-bold">{territory.doctorCount}</div>
                        <div className="small text-muted">Doctors</div>
                      </div>
                      <div>
                        <div className="fw-bold">{territory.medicalCount}</div>
                        <div className="small text-muted">Chemists</div>
                      </div>
                      <Link
                        to={`/territories/${territory._id}`}
                        className="btn btn-sm btn-outline-primary rounded-3 ms-auto align-self-center"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,.45)" }} onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content border-0 rounded-4">
              <form onSubmit={submit}>
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">{editing === "new" ? "New Territory" : "Edit Territory"}</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Name</label>
                      <input
                        required
                        className="form-control"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="e.g. Pune West"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Code <span className="text-muted fw-normal">(optional)</span></label>
                      <input
                        className="form-control text-uppercase"
                        value={form.code}
                        maxLength={20}
                        onChange={(event) => setForm({ ...form, code: event.target.value })}
                        placeholder="PNW"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(optional)</span></label>
                      <input
                        className="form-control"
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Territory manager</label>
                      <select
                        className="form-select"
                        value={form.managerId}
                        onChange={(event) => setForm({ ...form, managerId: event.target.value })}
                      >
                        <option value="">Not set</option>
                        {colleagues.map((colleague) => (
                          <option value={colleague._id} key={colleague._id}>
                            {colleague.name} — {String(colleague.role || "").replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Area tags <span className="text-muted fw-normal">(comma separated)</span></label>
                      <input
                        className="form-control"
                        value={form.areaTags}
                        onChange={(event) => setForm({ ...form, areaTags: event.target.value })}
                        placeholder="Kothrud, Baner, Aundh"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Reps assigned to this territory</label>
                      <div className="border rounded-3 p-2" style={{ maxHeight: "180px", overflowY: "auto" }}>
                        {colleagues.length === 0 ? (
                          <div className="text-muted small p-2">No employees available.</div>
                        ) : (
                          colleagues.map((colleague) => (
                            <label key={colleague._id} className="d-flex align-items-center gap-2 py-1 px-1">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={form.memberIds.includes(colleague._id)}
                                onChange={() => toggleMember(colleague._id)}
                              />
                              <span>{colleague.name}</span>
                              <span className="text-muted small text-capitalize">— {String(colleague.role || "").replace(/_/g, " ")}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light border" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : editing === "new" ? "Create Territory" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Territories;
