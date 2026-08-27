// Purely presentational status pill. Maps common status words to a
// consistent color across the app; anything unrecognized falls back to
// neutral gray. Does not alter or validate the status value itself.
const STATUS_COLOR = {
  active: "success",
  approved: "success",
  completed: "success",
  success: "success",
  paid: "success",
  verified: "success",

  pending: "warning",
  scheduled: "warning",
  in_progress: "warning",
  correction_requested: "warning",
  trial: "warning",
  draft: "warning",

  rejected: "danger",
  cancelled: "danger",
  canceled: "danger",
  failed: "danger",
  inactive: "danger",
  blocked: "danger",
  suspended: "danger",
  expired: "danger",
  overdue: "danger",

  info: "info",
};

const Badge = ({ status, children, className = "" }) => {
  const key = String(status || "").toLowerCase().trim();
  const color = STATUS_COLOR[key] || "secondary";
  const label = children ?? (status || "-");

  return (
    <span className={`mf-badge badge rounded-pill bg-${color}-subtle text-${color}-emphasis ${className}`}>
      {label}
    </span>
  );
};

export default Badge;
