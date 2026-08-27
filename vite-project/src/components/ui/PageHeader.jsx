// Purely presentational — replaces the repeated
// eyebrow/title/description header block copy-pasted at the top of most pages.
const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="mf-page-header">
    <div>
      {eyebrow && <div className="mf-page-header__eyebrow">{eyebrow}</div>}
      <h2 className="mf-page-header__title">{title}</h2>
      {description && <p className="mf-page-header__description">{description}</p>}
    </div>
    {actions && <div className="mf-page-header__actions">{actions}</div>}
  </div>
);

export default PageHeader;
