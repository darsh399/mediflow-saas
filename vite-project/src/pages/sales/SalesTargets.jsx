import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import targetApi from "../../api/targetApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader } from "../../components/ui";
import TargetsTab from "./TargetsTab";
import SalesTab from "./SalesTab";
import {
  MANAGER_ROLES,
  money,
  errorMessage,
  monthLabel,
  progressColor,
  RESPONSE_LABELS,
  fmtDate,
} from "./salesShared";

const ProgressBlock = ({ title, target, done, remaining, extra, pct, unit }) => (
  <div className="card border-0 shadow-sm rounded-4 h-100">
    <div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-start">
        <h6 className="fw-bold mb-0">{title}</h6>
        <span className={`badge text-bg-${progressColor(pct)}`}>
          {pct === null ? "no target" : `${pct}%`}
          {pct !== null && pct >= 100 ? " · exceeded" : ""}
        </span>
      </div>
      <div className="progress my-3" style={{ height: "10px" }}>
        <div className={`progress-bar bg-${progressColor(pct)}`} style={{ width: `${Math.min(100, pct || 0)}%` }} />
      </div>
      <div className="row text-center g-2">
        <div className="col">
          <div className="small text-muted">Target</div>
          <div className="fw-bold">{unit === "money" ? money(target) : target}</div>
        </div>
        <div className="col">
          <div className="small text-muted">Completed</div>
          <div className="fw-bold text-success">{unit === "money" ? money(done) : done}</div>
        </div>
        <div className="col">
          <div className="small text-muted">{extra > 0 ? "Extra" : "Remaining"}</div>
          <div className={`fw-bold ${extra > 0 ? "text-success" : ""}`}>
            {unit === "money" ? money(extra > 0 ? extra : remaining) : (extra > 0 ? extra : remaining)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Overview = ({ role, period }) => {
  const { notify } = useNotify();
  const isManager = MANAGER_ROLES.includes(role);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    targetApi
      .getTargetDashboard({ month: period.month, year: period.year })
      .then(setData)
      .catch((err) => notify(errorMessage(err, "Unable to load dashboard"), "", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (!data) return null;

  const s = data.summary;

  return (
    <div>
      {isManager && (
        <div className="row g-3 mb-3">
          <div className="col-6 col-lg-3"><MiniStat label="Employees" value={s.employeeCount} /></div>
          <div className="col-6 col-lg-3"><MiniStat label="MRs" value={s.mrCount} /></div>
          <div className="col-6 col-lg-3"><MiniStat label="Visits done" value={s.completedVisits} /></div>
          <div className="col-6 col-lg-3"><MiniStat label="Sales booked" value={money(s.completedSales)} /></div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <ProgressBlock
            title={isManager ? (s.scope === "company" ? "Company sales" : "Team sales") : "My sales"}
            target={s.salesTarget} done={s.completedSales} remaining={s.remainingSales}
            extra={Math.max(0, s.completedSales - s.salesTarget)} pct={s.salesProgress} unit="money"
          />
        </div>
        <div className="col-lg-6">
          <ProgressBlock
            title={isManager ? (s.scope === "company" ? "Company visits" : "Team visits") : "My visits"}
            target={s.visitTarget} done={s.completedVisits} remaining={s.remainingVisits}
            extra={Math.max(0, s.completedVisits - s.visitTarget)} pct={s.visitProgress} unit="count"
          />
        </div>
      </div>

      {isManager && data.rows.length > 0 && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-header bg-white border-0 p-4"><h5 className="fw-bold mb-0">Employee-wise performance</h5></div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: "var(--mf-surface-2)" }}>
                <tr>
                  <th className="px-4 py-3 border-0">Employee</th>
                  <th className="py-3 border-0">Visit target</th>
                  <th className="py-3 border-0">Done</th>
                  <th className="py-3 border-0">Remaining</th>
                  <th className="py-3 border-0">Sales target</th>
                  <th className="py-3 border-0">Done</th>
                  <th className="py-3 border-0">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.employeeId}>
                    <td className="px-4 py-3 fw-semibold">{row.name}</td>
                    <td className="py-3">{row.visitTarget || "—"}</td>
                    <td className="py-3">{row.completedVisits}</td>
                    <td className="py-3">{row.visitTarget ? row.remainingVisits : "—"}</td>
                    <td className="py-3">{row.salesTarget ? money(row.salesTarget) : "—"}</td>
                    <td className="py-3">{money(row.completedSales)}</td>
                    <td className="py-3">{row.salesTarget ? money(row.remainingSales) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">Doctor responses this month</h6>
              {data.responseMix.length === 0 ? (
                <div className="text-muted small">No responses recorded yet.</div>
              ) : (
                <ul className="list-unstyled mb-0">
                  {data.responseMix.map((row) => (
                    <li key={row.response} className="d-flex justify-content-between border-bottom py-1">
                      <span>{RESPONSE_LABELS[row.response] || row.response}</span>
                      <span className="fw-semibold">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Follow-ups required</h6>
                <Link to="/reports/visits?doctorResponse=FOLLOW_UP_REQUIRED" className="small">Open in reports</Link>
              </div>
              {data.followUps.length === 0 ? (
                <div className="text-muted small">Nothing flagged for follow-up.</div>
              ) : (
                <ul className="list-unstyled mb-0" style={{ maxHeight: 240, overflowY: "auto" }}>
                  {data.followUps.map((visit) => (
                    <li key={visit._id} className="border-bottom py-2 small">
                      <div className="fw-semibold">{visit.doctor || "—"} {visit.clinic ? <span className="text-muted">· {visit.clinic}</span> : null}</div>
                      <div className="text-muted">{fmtDate(visit.visitedAt)}{visit.employee ? ` · ${visit.employee}` : ""}{visit.notes ? ` — ${visit.notes}` : ""}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }) => (
  <div className="card border-0 shadow-sm rounded-4">
    <div className="card-body py-3">
      <div className="fs-4 fw-bold">{value}</div>
      <div className="small text-muted">{label}</div>
    </div>
  </div>
);

const SalesTargets = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const isManager = MANAGER_ROLES.includes(role);

  const now = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [tab, setTab] = useState("overview");

  const tabs = [
    { key: "overview", label: isManager ? "Overview" : "My Performance", icon: "bi-speedometer2" },
    { key: "targets", label: "Targets", icon: "bi-bullseye" },
    { key: "sales", label: "Sales", icon: "bi-cash-stack" },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Revenue & field performance"
        title="Sales Targets"
        description={`${isManager
          ? "Set monthly sales and visit targets and track them against real activity."
          : "Your monthly sales and visit targets, and how you're tracking against them."} Showing ${monthLabel(period.month, period.year)}.`}
      />

      <div className="container-fluid px-0">

        <ul className="nav nav-pills gap-2 mb-4 flex-nowrap overflow-auto pb-1">
          {tabs.map((t) => (
            <li className="nav-item" key={t.key}>
              <button
                type="button"
                className={`nav-link ${tab === t.key ? "active" : "bg-white border"}`}
                onClick={() => setTab(t.key)}
              >
                <i className={`bi ${t.icon} me-1`}></i>{t.label}
              </button>
            </li>
          ))}
        </ul>

        {tab === "overview" && <Overview role={role} period={period} />}
        {tab === "targets" && <TargetsTab role={role} period={period} setPeriod={setPeriod} />}
        {tab === "sales" && <SalesTab role={role} period={period} setPeriod={setPeriod} />}
      </div>
    </PageContainer>
  );
};

export default SalesTargets;
