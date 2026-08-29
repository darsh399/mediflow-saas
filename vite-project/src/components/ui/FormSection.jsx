// Groups related form fields under a titled section with an optional hint.
// `grid` lays children out in a responsive 2-up grid that collapses to a
// single column on narrow screens; wrap a full-width child in
// <div className="mf-col-full">. Presentational only — no validation logic.
const FormSection = ({ title, hint, grid = true, className = "", children }) => (
  <fieldset className={`mf-form-section ${className}`.trim()}>
    {title && <legend className="mf-form-section__title">{title}</legend>}
    {hint && <p className="mf-form-section__hint">{hint}</p>}
    <div className={grid ? "mf-form-section__grid" : ""}>{children}</div>
  </fieldset>
);

export default FormSection;
