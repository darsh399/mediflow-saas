import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import leaveApi from "../api/leaveApi";
import expenseApi from "../api/expenseApi";
import employeeProfileApi from "../api/employeeProfileApi";
import salaryApi from "../api/salaryApi";
import attendanceApi from "../api/attendanceApi";
import dcrApi from "../api/dcrApi";
import { useFeatureSet, hasFeature } from "./useFeature";

// Which roles can actually action each kind of request. These mirror the
// gating already used across the app (AdminLayout / AppRoutes / the individual
// management pages) so the inbox never shows an item the user can't act on.
const LEAVE_APPROVER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const EXPENSE_APPROVER_ROLES = ["admin", "company_owner", "hr_manager"];
const ONBOARDING_REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr"];
const OFFER_MANAGER_ROLES = ["admin", "company_owner", "hr_manager"];
const ATTENDANCE_REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr"];
const DCR_REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];

// A request older than this (calendar days) is flagged overdue in the inbox.
const SLA_DAYS = 3;

const EMPTY_GROUPS = { leaves: [], expenses: [], onboarding: [], offers: [], attendance: [], dcr: [] };

const ApprovalsContext = createContext({
  groups: EMPTY_GROUPS,
  counts: { leaves: 0, expenses: 0, onboarding: 0, offers: 0, attendance: 0, dcr: 0 },
  total: 0,
  overdue: 0,
  slaDays: SLA_DAYS,
  loading: false,
  error: "",
  ready: false,
  active: false,
  capabilities: { leaves: false, expenses: false, onboarding: false, offers: false, attendance: false, dcr: false },
  refresh: () => {},
});

// When each request kind started waiting.
const PENDING_SINCE = {
  leaves: (item) => item.appliedAt || item.createdAt || item.fromDate || item.startDate,
  expenses: (item) => item.createdAt || item.expenseDate,
  onboarding: (item) => item.submittedAt || item.updatedAt || item.createdAt,
  offers: (item) => item.createdAt,
  attendance: (item) => item.correction?.requestedAt || item.updatedAt,
  dcr: (item) => item.updatedAt || item.date,
};

// Adds `_ageDays` / `_overdue` to each row and sorts oldest first.
function annotateAge(list, key) {
  const now = Date.now();
  return list
    .map((item) => {
      const since = PENDING_SINCE[key]?.(item);
      const ageDays = since ? Math.max(0, Math.floor((now - new Date(since).getTime()) / 86400000)) : 0;
      return { ...item, _ageDays: ageDays, _overdue: ageDays >= SLA_DAYS };
    })
    .sort((a, b) => b._ageDays - a._ageDays);
}

export function useApprovals() {
  return useContext(ApprovalsContext);
}

const asArray = (value, key) =>
  Array.isArray(value?.[key]) ? value[key] : Array.isArray(value) ? value : [];

const isPending = (status) => String(status || "pending").toLowerCase() === "pending";

function ApprovalsProvider({ children }) {
  const role = useSelector((state) => state.auth.user?.role);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const token = useSelector((state) => state.auth.token);
  const featureSet = useFeatureSet();

  const capabilities = useMemo(
    () => ({
      leaves: LEAVE_APPROVER_ROLES.includes(role),
      expenses: EXPENSE_APPROVER_ROLES.includes(role),
      onboarding: ONBOARDING_REVIEWER_ROLES.includes(role),
      offers: OFFER_MANAGER_ROLES.includes(role),
      attendance: ATTENDANCE_REVIEWER_ROLES.includes(role) && hasFeature(featureSet, "attendance"),
      dcr: DCR_REVIEWER_ROLES.includes(role) && hasFeature(featureSet, "visits"),
    }),
    [role, featureSet]
  );

  const hasAnyCapability = Object.values(capabilities).some(Boolean);
  const active = Boolean((isAuthenticated || token) && hasAnyCapability);

  const [groups, setGroups] = useState(EMPTY_GROUPS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!active) {
      setGroups(EMPTY_GROUPS);
      setReady(true);
      return;
    }

    setLoading(true);
    setError("");

    const backgroundRequest = { _skipGlobalLoader: true };
    const [leaveResult, expenseResult, onboardingResult, offerResult, attendanceResult, dcrResult] = await Promise.allSettled([
      capabilities.leaves ? leaveApi.listLeaves(undefined, backgroundRequest) : Promise.resolve(null),
      capabilities.expenses ? expenseApi.listExpenses(undefined, backgroundRequest) : Promise.resolve(null),
      capabilities.onboarding ? employeeProfileApi.listProfiles(backgroundRequest) : Promise.resolve(null),
      capabilities.offers ? salaryApi.listOffers({ limit: 100 }, backgroundRequest) : Promise.resolve(null),
      capabilities.attendance ? attendanceApi.listAttendance({ correction: "PENDING", limit: 100 }, backgroundRequest) : Promise.resolve(null),
      capabilities.dcr ? dcrApi.listReports({ status: "SUBMITTED" }, backgroundRequest) : Promise.resolve(null),
    ]);

    if (!mountedRef.current) return;

    // A source "failed" only when the user was entitled to it but the request
    // rejected — a source the role can't see is simply skipped, not an error.
    const failed = [
      [capabilities.leaves, leaveResult],
      [capabilities.expenses, expenseResult],
      [capabilities.onboarding, onboardingResult],
      [capabilities.offers, offerResult],
      [capabilities.attendance, attendanceResult],
      [capabilities.dcr, dcrResult],
    ].some(([entitled, result]) => entitled && result.status === "rejected");

    const valueOf = (result) => (result.status === "fulfilled" ? result.value : null);

    const leaves = asArray(valueOf(leaveResult), "leaves").filter((leave) => isPending(leave.status));
    const expenses = asArray(valueOf(expenseResult), "expenses").filter((expense) => isPending(expense.status));
    const onboarding = asArray(valueOf(onboardingResult), "profiles").filter(
      (profile) => profile.status === "SUBMITTED" && profile.reviewEligibility?.canReview
    );
    const offers = asArray(valueOf(offerResult), "data").filter(
      (offer) => String(offer.status || "").toUpperCase() === "DRAFT"
    );
    const attendance = asArray(valueOf(attendanceResult), "attendance").filter(
      (record) => record.correction?.status === "PENDING"
    );
    const dcr = asArray(valueOf(dcrResult), "reports").filter((report) => report.status === "SUBMITTED");

    setGroups({
      leaves: annotateAge(leaves, "leaves"),
      expenses: annotateAge(expenses, "expenses"),
      onboarding: annotateAge(onboarding, "onboarding"),
      offers: annotateAge(offers, "offers"),
      attendance: annotateAge(attendance, "attendance"),
      dcr: annotateAge(dcr, "dcr"),
    });
    setError(failed ? "Some approval queues could not be loaded." : "");
    setLoading(false);
    setReady(true);
  }, [active, capabilities]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(
    () => ({
      leaves: groups.leaves.length,
      expenses: groups.expenses.length,
      onboarding: groups.onboarding.length,
      offers: groups.offers.length,
      attendance: groups.attendance.length,
      dcr: groups.dcr.length,
    }),
    [groups]
  );

  const total = counts.leaves + counts.expenses + counts.onboarding + counts.offers + counts.attendance + counts.dcr;

  const overdue = useMemo(
    () => Object.values(groups).reduce((sum, list) => sum + list.filter((item) => item._overdue).length, 0),
    [groups]
  );

  const value = useMemo(
    () => ({ groups, counts, total, overdue, slaDays: SLA_DAYS, loading, error, ready, refresh, capabilities, active }),
    [groups, counts, total, overdue, loading, error, ready, refresh, capabilities, active]
  );

  return <ApprovalsContext.Provider value={value}>{children}</ApprovalsContext.Provider>;
}

export default ApprovalsProvider;
