import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import leaveApi from "../api/leaveApi";
import expenseApi from "../api/expenseApi";
import employeeProfileApi from "../api/employeeProfileApi";
import salaryApi from "../api/salaryApi";

// Which roles can actually action each kind of request. These mirror the
// gating already used across the app (AdminLayout / AppRoutes / the individual
// management pages) so the inbox never shows an item the user can't act on.
const LEAVE_APPROVER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
const EXPENSE_APPROVER_ROLES = ["admin", "company_owner", "hr_manager"];
const ONBOARDING_REVIEWER_ROLES = ["admin", "company_owner", "hr_manager", "hr"];
const OFFER_MANAGER_ROLES = ["admin", "company_owner", "hr_manager"];

const EMPTY_GROUPS = { leaves: [], expenses: [], onboarding: [], offers: [] };

const ApprovalsContext = createContext({
  groups: EMPTY_GROUPS,
  counts: { leaves: 0, expenses: 0, onboarding: 0, offers: 0 },
  total: 0,
  loading: false,
  error: "",
  ready: false,
  active: false,
  capabilities: { leaves: false, expenses: false, onboarding: false, offers: false },
  refresh: () => {},
});

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

  const capabilities = useMemo(
    () => ({
      leaves: LEAVE_APPROVER_ROLES.includes(role),
      expenses: EXPENSE_APPROVER_ROLES.includes(role),
      onboarding: ONBOARDING_REVIEWER_ROLES.includes(role),
      offers: OFFER_MANAGER_ROLES.includes(role),
    }),
    [role]
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

    const [leaveResult, expenseResult, onboardingResult, offerResult] = await Promise.allSettled([
      capabilities.leaves ? leaveApi.listLeaves() : Promise.resolve(null),
      capabilities.expenses ? expenseApi.listExpenses() : Promise.resolve(null),
      capabilities.onboarding ? employeeProfileApi.listProfiles() : Promise.resolve(null),
      capabilities.offers ? salaryApi.listOffers({ limit: 100 }) : Promise.resolve(null),
    ]);

    if (!mountedRef.current) return;

    // A source "failed" only when the user was entitled to it but the request
    // rejected — a source the role can't see is simply skipped, not an error.
    const failed = [
      [capabilities.leaves, leaveResult],
      [capabilities.expenses, expenseResult],
      [capabilities.onboarding, onboardingResult],
      [capabilities.offers, offerResult],
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

    setGroups({ leaves, expenses, onboarding, offers });
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
    }),
    [groups]
  );

  const total = counts.leaves + counts.expenses + counts.onboarding + counts.offers;

  const value = useMemo(
    () => ({ groups, counts, total, loading, error, ready, refresh, capabilities, active }),
    [groups, counts, total, loading, error, ready, refresh, capabilities, active]
  );

  return <ApprovalsContext.Provider value={value}>{children}</ApprovalsContext.Provider>;
}

export default ApprovalsProvider;
