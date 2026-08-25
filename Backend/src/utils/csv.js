// Minimal CSV formatter — no external dependency needed for the small
// exports this app needs (leave/expense lists), avoids introducing a new
// package for a one-line escaping job.
function escapeCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// columns: [{ label, value: (row) => cellValue }]
export function toCsv(rows, columns) {
  const header = columns.map((col) => escapeCell(col.label)).join(',');
  const body = rows.map((row) => columns.map((col) => escapeCell(col.value(row))).join(',')).join('\n');
  return `${header}\n${body}`;
}

export function sendCsv(res, filename, rows, columns) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(toCsv(rows, columns));
}

export default { toCsv, sendCsv };
