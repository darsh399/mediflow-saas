import { Link } from "react-router-dom";

// Presentational breadcrumb trail. Pass an array of { label, to? } — the last
// item is rendered as the current page (no link). Render nothing for a single
// item so simple pages stay uncluttered.
const Breadcrumbs = ({ items = [] }) => {
  if (!Array.isArray(items) || items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="mf-breadcrumbs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} aria-current={isLast ? "page" : undefined}>
              {item.to && !isLast ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
