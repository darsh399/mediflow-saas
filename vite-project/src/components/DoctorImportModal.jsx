import { useRef, useState } from 'react'
import doctorApi from '../api/doctorApi'
import { downloadBlob } from '../utils/downloadBlob'

// Bulk Doctor import from an Excel file. Company Owner / HR Manager only — the
// button that opens this is gated in Doctors.jsx and the API is gated on the
// backend as well.
const DoctorImportModal = ({ onClose, onImported }) => {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const pickFile = (event) => {
    const chosen = event.target.files?.[0] || null
    setError('')
    setResult(null)
    if (chosen && !/\.(xlsx|xls)$/i.test(chosen.name)) {
      setFile(null)
      setError('Please choose a .xlsx or .xls file')
      return
    }
    setFile(chosen)
  }

  const handleTemplate = async () => {
    try {
      setDownloadingTemplate(true)
      const blob = await doctorApi.downloadDoctorTemplate()
      downloadBlob(blob, 'doctor-import-template.xlsx')
    } catch {
      setError('Could not download the template')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return setError('Choose a file first')
    try {
      setUploading(true)
      setError('')
      const data = await doctorApi.importDoctors(file)
      setResult(data)
      if (data.imported > 0) onImported?.()
    } catch (err) {
      setError(err?.response?.data?.message || 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4 border-0">
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold mb-0">Import Doctors from Excel</h5>
              <p className="text-muted small mb-0">Only Doctor Name and City are required per row. New territory names are created automatically.</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-3" onClick={handleTemplate} disabled={downloadingTemplate}>
                {downloadingTemplate
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Preparing...</>
                  : <><i className="bi bi-download me-2"></i>Download template</>}
              </button>
              <span className="text-muted small">Fill the template, then upload it below.</span>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Excel file</label>
              <input
                ref={inputRef}
                type="file"
                className="form-control"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={pickFile}
                disabled={uploading}
              />
              <div className="form-text">Accepted formats: .xlsx, .xls (max 5 MB)</div>
            </div>

            {result && (
              <div className="border rounded-3 p-3 bg-light">
                <div className="d-flex flex-wrap gap-3 mb-2">
                  <span className="fw-semibold">Total rows: {result.total}</span>
                  <span className="text-success fw-semibold">Imported: {result.imported}</span>
                  <span className="text-danger fw-semibold">Failed: {result.failed}</span>
                  {result.duplicates > 0 && <span className="text-warning-emphasis fw-semibold">Duplicates: {result.duplicates}</span>}
                </div>

                {Array.isArray(result.territoriesCreated) && result.territoriesCreated.length > 0 && (
                  <div className="small text-muted mb-2">
                    <i className="bi bi-geo-alt me-1"></i>
                    New territories created: {result.territoriesCreated.join(', ')}
                  </div>
                )}

                {Array.isArray(result.errors) && result.errors.length > 0 && (
                  <div className="table-responsive mt-2" style={{ maxHeight: 220 }}>
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: 80 }}>Row</th>
                          <th>Issue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((rowError) => (
                          <tr key={`${rowError.row}-${rowError.message}`}>
                            <td>{rowError.row}</td>
                            <td className={rowError.duplicate ? 'text-warning-emphasis' : 'text-danger'}>{rowError.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {result.imported > 0 && result.failed === 0 && (!result.errors || result.errors.length === 0) && (
                  <div className="text-success small mt-1"><i className="bi bi-check-circle-fill me-1"></i>All rows imported successfully.</div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-light border rounded-3 px-4" onClick={onClose} disabled={uploading}>
              Close
            </button>
            {result
              ? <button type="button" className="btn btn-outline-primary rounded-3 px-4" onClick={reset}>Import another file</button>
              : (
                <button type="button" className="btn btn-primary rounded-3 px-4 fw-semibold" onClick={handleUpload} disabled={uploading || !file}>
                  {uploading
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Importing...</>
                    : <><i className="bi bi-upload me-2"></i>Import</>}
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorImportModal
