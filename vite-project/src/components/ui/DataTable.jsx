import { useEffect, useState } from "react";
import { SkeletonTable } from "./Skeleton";

const Pagination = ({ page, pageCount, total, from, to, onChange }) => {
  if (pageCount <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pageCount; i += 1) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="mf-pagination">
      <span className="mf-pagination__info">{from}–{to} of {total}</span>
      <div className="mf-pagination__controls">
        <button type="button" className="btn btn-sm btn-ghost" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <i className="bi bi-chevron-left"></i>
        </button>
        {nums.map((n, index) => n === "…"
          ? <span key={`gap-${index}`} className="mf-pagination__gap">…</span>
          : <button key={n} type="button" className={`btn btn-sm ${n === page ? "btn-primary" : "btn-ghost"}`} onClick={() => onChange(n)}>{n}</button>)}
        <button type="button" className="btn btn-sm btn-ghost" disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

const DataTable = ({
  columns = [],
  rows = [],
  rowKey,
  loading = false,
  empty = null,
  mobileCards = false,
  onRowClick,
  className = "",
  pageSize = 0,
}) => {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const paginate = pageSize > 0 && total > pageSize;
  const pageCount = paginate ? Math.ceil(total / pageSize) : 1;

  useEffect(() => { if (page > pageCount) setPage(1); }, [page, pageCount]);

  if (loading) return <SkeletonTable rows={6} columns={Math.max(columns.length, 2)} />;
  if (!total && empty) return <div className="mf-data-table__wrap">{empty}</div>;

  const keyFor = rowKey || ((row, index) => row?._id ?? row?.id ?? index);
  const start = paginate ? (page - 1) * pageSize : 0;
  const visible = paginate ? rows.slice(start, start + pageSize) : rows;

  return (
    <div className="mf-data-table__wrap">
      <div className="mf-data-table__scroll">
        <table className={`mf-data-table ${mobileCards ? "mf-data-table--cards" : ""} ${className}`.trim()}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width, textAlign: col.align === "right" ? "right" : undefined }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr
                key={keyFor(row, start + index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    data-label={typeof col.header === "string" ? col.header : col.key}
                    className={col.align === "right" ? "mf-data-table__num" : undefined}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginate && (
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          from={start + 1}
          to={Math.min(start + pageSize, total)}
          onChange={setPage}
        />
      )}
    </div>
  );
};

export default DataTable;
