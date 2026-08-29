import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMedicals, deleteMedical } from "../../redux/slices/medicalSlice";
import { Link } from "react-router-dom";
import SearchBar from "../../components/SearchBar";
import { PageContainer, PageHeader, StatCard, FilterBar, DataTable, EmptyState } from "../../components/ui";

const Medicals = () => {
  const dispatch = useDispatch();
  const { items = [], loading, error } = useSelector((state) => state.medicals);

  const [refreshKey, setRefreshKey] = useState(0);
  const [q, setQ] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("");

  const territoryOptions = useMemo(
    () => Array.from(new Map(items.filter((m) => m.territoryId).map((m) => [m.territoryId._id, m.territoryId.name])).entries()),
    [items]
  );

  useEffect(() => {
    dispatch(fetchMedicals());
  }, [dispatch, refreshKey]);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this medical/shop?")) return;
    dispatch(deleteMedical(id)).then((result) => {
      if (!result?.error) setRefreshKey((k) => k + 1);
    });
  };

  const filteredMedicals = items.filter((medical) => {
    const searchValue = q.toLowerCase().trim();
    const name = medical?.name?.toLowerCase() || "";
    const contactPerson = medical?.contactPerson?.toLowerCase() || "";
    const city = medical?.city?.toLowerCase() || "";
    const mobile = medical?.mobile?.toLowerCase() || "";
    const matchesTerritory = !territoryFilter
      ? true
      : territoryFilter === "__none__"
        ? !medical.territoryId
        : medical.territoryId?._id === territoryFilter;
    return matchesTerritory && (name.includes(searchValue) || contactPerson.includes(searchValue) || city.includes(searchValue) || mobile.includes(searchValue));
  });

  const columns = [
    {
      key: "name",
      header: "Medical / Shop",
      render: (m) => (
        <div className="d-flex align-items-center gap-3">
          <span className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
            <i className="bi bi-shop"></i>
          </span>
          <div>
            <div className="fw-semibold">
              <Link to={`/medicals/${m._id}`} className="text-reset text-decoration-none">{m?.name || "—"}</Link>
            </div>
            <small className="text-muted">Medical / Pharmacy</small>
          </div>
        </div>
      ),
    },
    { key: "contactPerson", header: "Contact Person", render: (m) => m?.contactPerson || <span className="text-muted">—</span> },
    { key: "city", header: "City", render: (m) => m?.city || <span className="text-muted">—</span> },
    {
      key: "territory",
      header: "Territory",
      render: (m) => m?.territoryId
        ? <span className="mf-badge mf-badge--primary">{m.territoryId.name}</span>
        : <span className="text-muted small">Unassigned</span>,
    },
    { key: "mobile", header: "Phone", render: (m) => m?.mobile || <span className="text-muted">—</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <div className="d-flex justify-content-end gap-2">
          <Link to={`/medicals/${m._id}`} className="btn btn-sm btn-outline-primary rounded-3"><i className="bi bi-eye me-1"></i> View</Link>
          <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(m._id)} aria-label="Delete medical">
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Field"
        title="Medicals & Shops"
        description="Manage medical shops and their contact information."
        actions={
          <Link className="btn btn-primary rounded-3 fw-semibold" to="/medicals/add">
            <i className="bi bi-plus-lg me-2"></i> Add Medical
          </Link>
        }
      />

      <div className="row g-3">
        <div className="col-6 col-xl-3"><StatCard label="Total Medicals" value={items.length} icon="bi-shop" /></div>
        <div className="col-6 col-xl-3">
          <StatCard label="Showing" value={filteredMedicals.length} icon="bi-funnel"
            iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" />
        </div>
      </div>

      <FilterBar>
        <FilterBar.Field grow>
          <SearchBar value={q} onChange={setQ} placeholder="Search by name, contact, city or phone" />
        </FilterBar.Field>
        <FilterBar.Field label="Territory" htmlFor="m-territory">
          <select id="m-territory" className="form-select form-select-sm" value={territoryFilter} onChange={(e) => setTerritoryFilter(e.target.value)}>
            <option value="">All territories</option>
            <option value="__none__">Unassigned</option>
            {territoryOptions.map(([tId, tName]) => <option key={tId} value={tId}>{tName}</option>)}
          </select>
        </FilterBar.Field>
      </FilterBar>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-0">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>Could not load medicals. {error?.message || "Please try again."}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filteredMedicals}
        rowKey={(m) => m._id}
        loading={loading}
        mobileCards
        empty={
          <EmptyState
            icon="bi-shop-window"
            title="No medicals found"
            description={q || territoryFilter ? "No medical shops match the current search and filters." : "No medical shops have been added yet."}
            action={!q && !territoryFilter && (
              <Link to="/medicals/add" className="btn btn-primary rounded-3"><i className="bi bi-plus-lg me-2"></i> Add your first medical</Link>
            )}
          />
        }
      />
    </PageContainer>
  );
};

export default Medicals;
