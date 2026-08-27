import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import territoryApi from "../../api/territoryApi";
import doctorApi from "../../api/doctorApi";
import medicalApi from "../../api/medicalApi";
import { useNotify } from "../../components/NotificationProvider";

const MANAGE_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const territoryIdOf = (place) => place?.territoryId?._id || place?.territoryId || null;

const AssignPanel = ({ title, icon, places, currentTerritoryId, canManage, onSave }) => {
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setSelected(new Set(places.filter((place) => territoryIdOf(place) === currentTerritoryId).map((place) => place._id)));
  }, [places, currentTerritoryId]);

  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      places
        .filter((place) => !term || (place.name || "").toLowerCase().includes(term) || (place.city || "").toLowerCase().includes(term))
        .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [places, term]
  );

  const assigned = places.filter((place) => territoryIdOf(place) === currentTerritoryId);

  const toggle = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave([...selected]);
      setShowPicker(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="fw-bold mb-0">
            <i className={`bi ${icon} me-2`}></i>{title}
          </h5>
          <small className="text-muted">{assigned.length} assigned</small>
        </div>
        {canManage && (
          <button type="button" className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setShowPicker((value) => !value)}>
            {showPicker ? "Close" : "Manage"}
          </button>
        )}
      </div>

      <div className="card-body p-4 pt-0">
        {showPicker && canManage ? (
          <>
            <input
              className="form-control form-control-sm mb-2"
              placeholder="Search by name or city…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="border rounded-3" style={{ maxHeight: "320px", overflowY: "auto" }}>
              {visible.length === 0 ? (
                <div className="text-muted small p-3">Nothing to show.</div>
              ) : (
                visible.map((place) => {
                  const otherTerritory =
                    territoryIdOf(place) && territoryIdOf(place) !== currentTerritoryId ? place.territoryId?.name || "another territory" : null;
                  return (
                    <label key={place._id} className="d-flex align-items-center gap-2 px-3 py-2 border-bottom">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={selected.has(place._id)}
                        onChange={() => toggle(place._id)}
                      />
                      <span className="flex-grow-1">
                        <span className="fw-semibold">{place.name}</span>
                        {place.city && <span className="text-muted small"> · {place.city}</span>}
                      </span>
                      {otherTerritory && (
                        <span className="badge rounded-pill text-bg-light border fw-normal">in {otherTerritory}</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">{selected.size} selected · moving one here removes it from its current territory</small>
              <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        ) : assigned.length === 0 ? (
          <p className="text-muted small mb-0">None assigned yet.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {assigned
              .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
              .map((place) => (
                <li key={place._id} className="py-2 border-bottom d-flex justify-content-between">
                  <span className="fw-semibold">{place.name}</span>
                  <span className="text-muted small">{[place.city, place.district].filter(Boolean).join(", ")}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const TerritoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();
  const role = useSelector((state) => state.auth.user?.role);
  const canManage = MANAGE_ROLES.includes(role);

  const [territory, setTerritory] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [territoryResult, doctorsResult, medicalsResult] = await Promise.all([
        territoryApi.getTerritory(id),
        doctorApi.listDoctors(),
        medicalApi.listMedicals(),
      ]);
      setTerritory(territoryResult.territory);
      setDoctors(doctorsResult.doctors || []);
      setMedicals(medicalsResult.medicals || []);
    } catch (err) {
      setError(errorMessage(err, "Unable to load territory"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const savePlaces = async (payload, successLabel) => {
    try {
      await territoryApi.setTerritoryPlaces(id, payload);
      notify(`${successLabel} updated`);
      await load();
    } catch (err) {
      notify(errorMessage(err, "Unable to update assignments"), "", "error");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
            <p className="text-muted mb-0">Loading territory…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !territory) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="alert alert-danger border-0 shadow-sm rounded-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || "Territory not found"}
        </div>
        <Link to="/territories" className="btn btn-outline-secondary">Back to territories</Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        <button type="button" className="btn btn-sm btn-light border mb-3" onClick={() => navigate("/territories")}>
          <i className="bi bi-arrow-left me-1"></i>Territories
        </button>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <h2 className="fw-bold mb-0">{territory.name}</h2>
              {territory.code && <span className="badge text-bg-light border">{territory.code}</span>}
              {territory.active === false && <span className="badge text-bg-secondary">Inactive</span>}
            </div>
            {territory.description && <p className="text-muted mb-3">{territory.description}</p>}

            <div className="row g-3">
              <div className="col-md-4">
                <div className="text-muted small">Territory manager</div>
                <div className="fw-semibold">{territory.managerId?.name || "Not set"}</div>
              </div>
              <div className="col-md-8">
                <div className="text-muted small">Reps</div>
                {(territory.memberIds || []).length === 0 ? (
                  <div className="fw-semibold">None assigned</div>
                ) : (
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {territory.memberIds.map((member) => (
                      <span key={member._id} className="badge rounded-pill text-bg-light border fw-normal">
                        {member.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(territory.areaTags || []).length > 0 && (
              <div className="d-flex flex-wrap gap-1 mt-3">
                {territory.areaTags.map((tag) => (
                  <span key={tag} className="badge rounded-pill text-bg-light border fw-normal">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <AssignPanel
              title="Doctors"
              icon="bi-heart-pulse"
              places={doctors}
              currentTerritoryId={territory._id}
              canManage={canManage}
              onSave={(doctorIds) => savePlaces({ doctorIds }, "Doctors")}
            />
          </div>
          <div className="col-lg-6">
            <AssignPanel
              title="Chemists"
              icon="bi-hospital"
              places={medicals}
              currentTerritoryId={territory._id}
              canManage={canManage}
              onSave={(medicalIds) => savePlaces({ medicalIds }, "Chemists")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerritoryDetail;
