// Same "fetch blob, trigger a browser download" pattern already used for
// document/visit-photo downloads elsewhere in this app — centralized here
// since CSV exports need it in more than one place.
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default downloadBlob
