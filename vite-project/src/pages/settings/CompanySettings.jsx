import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import calendarApi from "../../api/calendarApi";
import payrollApi from "../../api/payrollApi";
import leaveApi from "../../api/leaveApi";
import expenseApi from "../../api/expenseApi";
import { useNotify } from "../../components/NotificationProvider";
import { PageContainer, PageHeader } from "../../components/ui";

const WEEK_DAYS = [
  ["MONDAY", "Mon"], ["TUESDAY", "Tue"], ["WEDNESDAY", "Wed"], ["THURSDAY", "Thu"],
  ["FRIDAY", "Fri"], ["SATURDAY", "Sat"], ["SUNDAY", "Sun"],
];
const PAYROLL_ROLES = ["admin", "company_owner", "hr_manager"];

const errText = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const NumField = ({ label, value, onChange, disabled }) => (
  <div className="col-sm-6 col-lg-4">
    <label className="form-label fw-semibold small">{label}</label>
    <input
      type="number"
      className="form-control"
      min="0"
      step="0.01"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
    />
  </div>
);

const Check = ({ label, checked, onChange, disabled, strong }) => (
  <label className="form-check">
    <input className="form-check-input" type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    <span className={`form-check-label ms-2 ${strong ? "fw-semibold" : ""}`}>{label}</span>
  </label>
);

export default function CompanySettings() {
  const role = useSelector((state) => state.auth.user?.role);
  const canManagePayroll = PAYROLL_ROLES.includes(role);
  const { notify } = useNotify();

  const [loading, setLoading] = useState(true);
  const [workingDays, setWorkingDays] = useState([]);
  const [workingSaving, setWorkingSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [payrollSaving, setPayrollSaving] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [holidayCount, setHolidayCount] = useState(null);
  const [travel, setTravel] = useState(null);
  const [travelSaving, setTravelSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [cal, pay, pol, hol, exp] = await Promise.allSettled([
        calendarApi.getSettings(),
        canManagePayroll ? payrollApi.getSettings() : Promise.resolve(null),
        leaveApi.getPolicy(),
        calendarApi.listHolidays(),
        expenseApi.getSettings(),
      ]);
      if (cancelled) return;
      if (cal.status === "fulfilled") setWorkingDays(cal.value.weeklyWorkingDays || []);
      if (pay.status === "fulfilled" && pay.value) setSettings(pay.value.settings || null);
      if (pol.status === "fulfilled") setPolicy(pol.value?.policy || pol.value || null);
      if (hol.status === "fulfilled") setHolidayCount((hol.value.holidays || []).length);
      if (exp.status === "fulfilled") setTravel(exp.value.travelAllowance || { ratePerKm: 0, dailyAllowance: 0 });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [canManagePayroll]);

  const toggleDay = (day) =>
    setWorkingDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));

  async function saveWorkingDays() {
    try {
      setWorkingSaving(true);
      const response = await calendarApi.updateSettings(workingDays);
      setWorkingDays(response.weeklyWorkingDays);
      notify("Working days updated");
    } catch (err) {
      notify(errText(err, "Unable to update working days"), "", "error");
    } finally {
      setWorkingSaving(false);
    }
  }

  const setField = (field, value) => setSettings((current) => ({ ...current, [field]: value }));

  async function savePayroll() {
    try {
      setPayrollSaving(true);
      const response = await payrollApi.updateSettings(settings);
      setSettings(response.settings);
      notify("Statutory deductions updated");
    } catch (err) {
      notify(errText(err, "Unable to update payroll settings"), "", "error");
    } finally {
      setPayrollSaving(false);
    }
  }

  async function saveTravel() {
    try {
      setTravelSaving(true);
      const response = await expenseApi.updateSettings({
        ratePerKm: Number(travel.ratePerKm) || 0,
        dailyAllowance: Number(travel.dailyAllowance) || 0,
      });
      setTravel(response.travelAllowance);
      notify("Travel allowance updated");
    } catch (err) {
      notify(errText(err, "Unable to update travel allowance"), "", "error");
    } finally {
      setTravelSaving(false);
    }
  }

  const leaveTypes = policy?.leaveTypes || [];

  return (
    <PageContainer>
      <PageHeader eyebrow="Company" title="Company Settings" description="Working days, statutory deductions and policies in one place." />

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-1">Working days</h5>
              <p className="text-muted small mb-3">Days left unselected count as weekly offs for attendance and leave.</p>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {WEEK_DAYS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`btn btn-sm rounded-pill ${workingDays.includes(value) ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => toggleDay(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-primary rounded-3" disabled={workingSaving || !workingDays.length} onClick={saveWorkingDays}>
                {workingSaving ? "Saving…" : "Save working days"}
              </button>
            </div>
          </div>

          {canManagePayroll && settings && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Statutory deductions</h5>
                <p className="text-muted small mb-3">Applied to every payroll run.</p>
                <div className="row g-3">
                  <div className="col-12"><Check strong label="Provident Fund (PF)" checked={settings.pfEnabled} onChange={(value) => setField("pfEnabled", value)} /></div>
                  <NumField label="PF rate %" value={settings.pfRate} onChange={(value) => setField("pfRate", value)} disabled={!settings.pfEnabled} />
                  <NumField label="PF wage ceiling ₹" value={settings.pfWageCeiling} onChange={(value) => setField("pfWageCeiling", value)} disabled={!settings.pfEnabled} />
                  <div className="col-12"><Check label="Contribute on full basic (ignore ceiling)" checked={settings.pfOnFullBasic} onChange={(value) => setField("pfOnFullBasic", value)} disabled={!settings.pfEnabled} /></div>

                  <div className="col-12 pt-2"><Check strong label="Employees' State Insurance (ESI)" checked={settings.esiEnabled} onChange={(value) => setField("esiEnabled", value)} /></div>
                  <NumField label="ESI rate %" value={settings.esiRate} onChange={(value) => setField("esiRate", value)} disabled={!settings.esiEnabled} />
                  <NumField label="ESI gross threshold ₹" value={settings.esiGrossThreshold} onChange={(value) => setField("esiGrossThreshold", value)} disabled={!settings.esiEnabled} />

                  <div className="col-12 pt-2"><Check strong label="Professional Tax (PT)" checked={settings.ptEnabled} onChange={(value) => setField("ptEnabled", value)} /></div>
                  <NumField label="PT monthly amount ₹" value={settings.ptAmount} onChange={(value) => setField("ptAmount", value)} disabled={!settings.ptEnabled} />

                  <div className="col-12">
                    <button type="button" className="btn btn-primary rounded-3" disabled={payrollSaving} onClick={savePayroll}>
                      {payrollSaving ? "Saving…" : "Save deductions"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {travel && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Travel &amp; daily allowance</h5>
                <p className="text-muted small mb-3">Used by the "calculate from visits" helper on expense claims. Set to 0 to disable.</p>
                <div className="row g-3">
                  <NumField label="Rate per km ₹" value={travel.ratePerKm} onChange={(value) => setTravel((current) => ({ ...current, ratePerKm: value }))} />
                  <NumField label="Daily allowance ₹ (per visit day)" value={travel.dailyAllowance} onChange={(value) => setTravel((current) => ({ ...current, dailyAllowance: value }))} />
                  <div className="col-12">
                    <button type="button" className="btn btn-primary rounded-3" disabled={travelSaving} onClick={saveTravel}>
                      {travelSaving ? "Saving…" : "Save allowance"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="fw-bold mb-1">Leave policy</h5>
                  <p className="text-muted small mb-0">{leaveTypes.filter((type) => type.enabled).length} active leave type(s)</p>
                </div>
                <Link to="/leaves/manage" className="btn btn-outline-primary btn-sm rounded-3">Manage policy</Link>
              </div>
              {leaveTypes.length > 0 && (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr className="border-bottom">
                        <th className="py-2 text-muted small text-uppercase">Type</th>
                        <th className="py-2 text-muted small text-uppercase">Yearly</th>
                        <th className="py-2 text-muted small text-uppercase">Monthly accrual</th>
                        <th className="py-2 text-muted small text-uppercase">Carry forward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveTypes.map((type) => (
                        <tr key={type.code} className={type.enabled ? "" : "text-muted"}>
                          <td className="py-2">
                            {type.name}
                            {!type.enabled && <span className="badge text-bg-secondary ms-2">Off</span>}
                          </td>
                          <td className="py-2">{type.yearlyAllowance || "—"}</td>
                          <td className="py-2">{type.monthlyAccrual || "—"}</td>
                          <td className="py-2">{type.maxCarryForward || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1">Company holidays</h5>
                <p className="text-muted small mb-0">{holidayCount ?? "—"} holiday(s) configured</p>
              </div>
              <Link to="/calendar" className="btn btn-outline-primary btn-sm rounded-3">Open calendar</Link>
            </div>
          </div>

        </div>
      )}
    </PageContainer>
  );
}
