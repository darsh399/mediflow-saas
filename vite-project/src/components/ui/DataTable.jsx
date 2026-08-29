import { SkeletonTable } from "./Skeleton";

// Consistent table shell used across list pages.
//
// columns: [{ key, header, render?(row), align?: "left"|"right", width?, mobileHidden? }]
// rows:    array of row objects
// rowKey:  (row, index) => key   (defaults to row._id ?? row.id ?? index)
// loading: shows a skeleton table
// empty:   node shown when there are no rows (pass an <EmptyState/>)
// mobileCards: on <=640px, stack each row as a labelled card instead of scrolling
//
// Presentational only — sorting/pagination/filtering stay with the caller.
const DataTable = ({
  columns = [],
  rows = [],
  rowKey,
  loading = false,
  empty = null,
  mobileCards = false,
  onRowClick,
  className = "",
}) => {
  if (loading) return <SkeletonTable rows={6} columns={Math.max(columns.length, 2)} />;
  if (!rows.length && empty) return <div className="mf-data-table__wrap">{empty}</div>;

  const keyFor = rowKey || ((row, index) => row?._id ?? row?.id ?? index);

  return (
    <div className="mf-data-table__wrap">
      <div className="mf-data-table__scroll">
        <table className={`mf-data-table ${mobileCards ? "mf-data-table--cards" : ""} ${className}`.trim()}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align === "right" ? "right" : undefined }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={keyFor(row, index)}
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
    </div>
  );
};

export default DataTable;
