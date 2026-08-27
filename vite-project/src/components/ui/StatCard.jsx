// Purely presentational — replaces the copy-pasted icon+label+value stat-card
// block seen across dashboards/list pages. `value` is rendered as-is (no
// computed metrics here); pass `error` to show a load failure instead.
const StatCard = ({ icon, label, value, error, iconBg = "var(--mf-color-primary-subtle)", iconColor = "var(--mf-color-primary)" }) => (
  <div className="mf-stat-card">
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <div className="mf-stat-card__label">{label}</div>
        {error ? (
          <>
            <div className="mf-stat-card__value">—</div>
            <div className="mf-stat-card__error">{error}</div>
          </>
        ) : (
          <div className="mf-stat-card__value">{value}</div>
        )}
      </div>
      {icon && (
        <div className="mf-stat-card__icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          <i className={`bi ${icon}`}></i>
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
