// Shimmer placeholders for loading states. Presentational only.

export const Skeleton = ({ width = "100%", height = "1rem", radius, className = "", style = {} }) => (
  <span
    className={`mf-skeleton ${className}`.trim()}
    style={{ width, height, borderRadius: radius, ...style }}
    aria-hidden="true"
  />
);

// A table-shaped skeleton for list pages while rows load.
export const SkeletonTable = ({ rows = 6, columns = 4 }) => (
  <div className="mf-data-table__wrap" aria-hidden="true">
    <div className="mf-data-table__scroll">
      <table className="mf-data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}><Skeleton width="60%" height=".7rem" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}><Skeleton width={colIndex === 0 ? "75%" : "45%"} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Skeleton;
