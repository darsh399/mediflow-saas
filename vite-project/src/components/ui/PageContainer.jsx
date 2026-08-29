// Consistent page shell: centred max-width, vertical rhythm between the
// breadcrumb / header / filters / content blocks. Presentational only —
// replaces the ad-hoc `container-fluid py-4` + inline background each page
// currently repeats.
const PageContainer = ({ width = "default", className = "", children }) => {
  const widthClass = width === "narrow" ? "mf-page--narrow" : width === "wide" ? "mf-page--wide" : "";
  return (
    <div className="container-fluid py-4">
      <div className={`mf-page ${widthClass} ${className}`.trim()}>{children}</div>
    </div>
  );
};

export default PageContainer;
