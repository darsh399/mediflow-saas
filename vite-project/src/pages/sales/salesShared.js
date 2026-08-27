export const MANAGER_ROLES = ["admin", "company_owner", "hr_manager", "manager", "project_manager"];
export const COMPANY_WIDE_ROLES = ["admin", "company_owner", "hr_manager", "hr"];

export const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthLabel = (month, year) => `${MONTHS[month - 1]} ${year}`;

// A short list of selectable months (current + previous 11).
export const recentMonths = () => {
  const now = new Date();
  const list = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return list;
};

export const progressColor = (pct) => {
  if (pct === null || pct === undefined) return "secondary";
  if (pct >= 100) return "success";
  if (pct >= 70) return "warning";
  return "danger";
};

export const RESPONSE_LABELS = {
  POSITIVE: "Positive",
  NEGATIVE: "Negative",
  NEUTRAL: "Neutral",
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not interested",
  FOLLOW_UP_REQUIRED: "Follow-up required",
};

export const fmtDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
