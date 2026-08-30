// Consistent container for a page's search + filter controls. Presentational
// only — it does not own any filter state. Compose with <FilterBar.Field>.
const FilterBar = ({ className = "", children }) => (
  <div className={`mf-filter-bar ${className}`.trim()}>{children}</div>
);

const Field = ({ label, htmlFor, grow = false, className = "", children }) => (
  <div className={`mf-filter-bar__field ${grow ? "mf-filter-bar__field--grow" : ""} ${className}`.trim()}>
    {label && <label htmlFor={htmlFor}>{label}</label>}
    {children}
  </div>
);

const Actions = ({ children }) => <div className="mf-filter-bar__actions">{children}</div>;

FilterBar.Field = Field;
FilterBar.Actions = Actions;

export default FilterBar;
