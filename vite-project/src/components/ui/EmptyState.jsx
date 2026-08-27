// Purely presentational. Only renders an action if the caller passes one —
// never invents a workflow that doesn't already exist on the page.
const EmptyState = ({ icon = "bi-inbox", title, description, action }) => (
  <div className="mf-empty-state">
    <div className="mf-empty-state__icon">
      <i className={`bi ${icon}`}></i>
    </div>
    <div className="mf-empty-state__title">{title}</div>
    {description && <p className="mf-empty-state__description">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
