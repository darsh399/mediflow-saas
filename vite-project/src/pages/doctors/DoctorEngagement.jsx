import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import doctorCrmApi from "../../api/doctorCrmApi";
import territoryApi from "../../api/territoryApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader, StatCard, FilterBar, DataTable, EmptyState } from "../../components/ui";

const errorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const TIER_VARIANT = { A: "success", B: "primary", C: "warning", UNGRADED: "neutral" };

const DoctorEngagement = () => {
  const { notify } = useNotify();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ tier: "", territoryId: "", specialty: "", days: 30, quick: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = { days: filters.days };
      if (filters.tier) params.tier = filters.tier;
      if (filters.territoryId) params.territoryId = filters.territoryId;
      if (filters.specialty) params.specialty = filters.specialty;
      if (filters.quick === "overdue") params.overdue = "true";
      if (filters.quick === "birthday") params.birthday = "true";
      if (filters.quick === "followUp") params.followUp = "true";
      if (filters.quick === "consent") params.consent = "true";
      const response = await doctorCrmApi.listEngagement(params);
      setRows(response.doctors || []);
      setSummary(response.summary || null);
    } catch (err) {
      notify(errorMessage(err, "Unable to load engagement list"), "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    territoryApi.listTerritories().then((r) => setTerritories(r.territories || [])).catch(() => setTerritories([]));
  }, []);

  const set = (patch) => setFilters((current) => ({ ...current, ...patch }));

  const columns = [
    {
      key: "doctor",
      header: "Doctor",
      render: (row) => (
        <div>
          <Link to={`/doctors/${row._id}`} className="fw-semibold text-reset text-decoration-none">{row.name}</Link>
          <div className="small text-muted">{[row.clinicName, row.specialty].filter(Boolean).join(" · ")}</div>
        </div>
      ),
    },
    { key: "tier", header: "Tier", render: (row) => <span className={`mf-badge mf-badge--${TIER_VARIANT[row.tier] || "neutral"}`}>{row.tier}</span> },
    { key: "territory", header: "Territory", render: (row) => row.territory || <span className="text-muted small">—</span> },
    { key: "visitCount", header: "Visits", render: (row) => row.visitCount },
    {
      key: "lastActivity",
      header: "Last activity",
      render: (row) => (
        <div>
          {row.daysSince === null ? <span className="text-danger small">Never</span> : `${row.daysSince}d ago`}
          <div className="small text-muted">{fmt(row.lastActivityAt)}</div>
        </div>
      ),
    },
    {
      key: "signals",
      header: "Signals",
      render: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.overdue && <span className="mf-badge mf-badge--danger">overdue</span>}
          {row.birthdayThisMonth && <span className="mf-badge mf-badge--info">birthday</span>}
          {row.anniversaryThisMonth && <span className="mf-badge mf-badge--info">anniversary</span>}
          {row.nextFollowUp && <span className="mf-badge mf-badge--warning">follow-up {fmt(row.nextFollowUp)}</span>}
          {row.marketingConsent && <span className="mf-badge mf-badge--neutral">consent</span>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => <Link to={`/doctors/${row._id}`} className="btn btn-sm btn-outline-primary rounded-3">Open</Link>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Doctor CRM"
        title="Doctor Engagement"
        description="Who to engage and why — by tier, coverage gap, birthday and follow-up."
      />

      {summary && (
        <div className="row g-3">
          {[
            ["", "All doctors", summary.total, "bi-people", "var(--mf-color-primary-subtle)", "var(--mf-color-primary)"],
            ["overdue", "Overdue", summary.overdue, "bi-exclamation-triangle", "var(--mf-color-danger-subtle)", "var(--mf-color-danger)"],
            ["birthday", "Birthday this month", summary.birthdays, "bi-gift", "var(--mf-color-info-subtle)", "var(--mf-color-info)"],
            ["followUp", "Follow-up due", summary.dueFollowUp, "bi-flag", "var(--mf-color-warning-subtle)", "var(--mf-color-warning)"],
          ].map(([quick, label, value, icon, iconBg, iconColor]) => (
            <div className="col-6 col-xl-3" key={label}>
              <button
                type="button"
                className="btn p-0 border-0 bg-transparent w-100 text-start"
                aria-pressed={filters.quick === quick && !!quick}
                onClick={() => set({ quick: filters.quick === quick ? "" : quick })}
              >
                <StatCard label={filters.quick === quick && quick ? `${label} · filtering` : label} value={value} icon={icon} iconBg={iconBg} iconColor={iconColor} />
              </button>
            </div>
          ))}
        </div>
      )}

      <FilterBar>
        <FilterBar.Field label="Tier" htmlFor="e-tier">
          <select id="e-tier" className="form-select form-select-sm" value={filters.tier} onChange={(e) => set({ tier: e.target.value })}>
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="UNGRADED">Ungraded</option>
          </select>
        </FilterBar.Field>
        <FilterBar.Field label="Territory" htmlFor="e-territory">
          <select id="e-territory" className="form-select form-select-sm" value={filters.territoryId} onChange={(e) => set({ territoryId: e.target.value })}>
            <option value="">All</option>
            {territories.map((t) => <option value={t._id} key={t._id}>{t.name}</option>)}
          </select>
        </FilterBar.Field>
        <FilterBar.Field label="Specialty" htmlFor="e-specialty">
          <input id="e-specialty" className="form-control form-control-sm" value={filters.specialty} onChange={(e) => set({ specialty: e.target.value })} placeholder="e.g. Cardiology" />
        </FilterBar.Field>
        <FilterBar.Field label="Overdue after" htmlFor="e-days">
          <select id="e-days" className="form-select form-select-sm" value={filters.days} onChange={(e) => set({ days: Number(e.target.value) })}>
            {[15, 30, 45, 60, 90].map((d) => <option value={d} key={d}>{d} days</option>)}
          </select>
        </FilterBar.Field>
        <FilterBar.Actions>
          <button type="button" className={`btn btn-sm ${filters.quick === "consent" ? "btn-primary" : "btn-ghost"}`} onClick={() => set({ quick: filters.quick === "consent" ? "" : "consent" })}>
            Consented only
          </button>
        </FilterBar.Actions>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        pageSize={25}
        rowKey={(r) => r._id}
        loading={loading}
        mobileCards
        empty={<EmptyState icon="bi-people" title="No doctors match these filters" description="Try widening the tier, territory or coverage window." />}
      />
    </PageContainer>
  );
};

export default DoctorEngagement;
