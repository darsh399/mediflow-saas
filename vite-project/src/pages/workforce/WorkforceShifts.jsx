import { useEffect, useState } from 'react'
import workforceApi from '../../api/workforceApi'
import userApi from '../../api/userApi'
import { PageContainer, PageHeader, SkeletonTable } from '../../components/ui'

export default function WorkforceShifts() {
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().slice(0, 10), startTime: '09:00', endTime: '18:00', notes: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isManager = ['admin', 'company_owner', 'hr_manager', 'manager'].includes(JSON.parse(localStorage.getItem('auth') || '{}').user?.role)
  const load = () => workforceApi.listShifts().then((response) => setShifts(response.shifts || [])).catch((err) => setError(err?.response?.data?.message || 'Unable to load shifts')).finally(() => setLoading(false))
  useEffect(() => { load(); userApi.listUsers().then((response) => setEmployees((response.users || []).filter((user) => user.active !== false))).catch(() => setEmployees([])) }, [])
  const create = async (event) => { event.preventDefault(); setError(''); try { await workforceApi.createShift(form); setForm((current) => ({ ...current, employeeId: '', notes: '' })); await load() } catch (err) { setError(err?.response?.data?.message || 'Unable to create shift') } }
  const remove = async (id) => { try { await workforceApi.deleteShift(id); setShifts((current) => current.filter((shift) => shift._id !== id)) } catch (err) { setError(err?.response?.data?.message || 'Unable to delete shift') } }
  return <PageContainer><PageHeader eyebrow="Workforce" title="Shift Schedule" description="Plan and review employee working shifts." />
    {error && <div className="alert alert-danger">{error}</div>}
    {isManager && <form className="card border-0 shadow-sm p-4 mb-4" onSubmit={create}><div className="row g-3 align-items-end"><div className="col-md-3"><label className="form-label">Employee</label><select className="form-select" required value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name}</option>)}</select></div><div className="col-md-2"><label className="form-label">Date</label><input type="date" className="form-control" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div><div className="col-md-2"><label className="form-label">Start</label><input type="time" className="form-control" required value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></div><div className="col-md-2"><label className="form-label">End</label><input type="time" className="form-control" required value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></div><div className="col-md-3"><button className="btn btn-primary w-100" type="submit"><i className="bi bi-plus-lg me-1" /> Add shift</button></div></div></form>}
    {loading ? <SkeletonTable rows={5} columns={4} /> : <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Employee</th><th>Date</th><th>Shift</th>{isManager && <th />}</tr></thead><tbody>{shifts.map((shift) => <tr key={shift._id}><td>{shift.employeeId?.name || 'Employee'}</td><td>{new Date(shift.date).toLocaleDateString('en-IN')}</td><td>{shift.startTime} - {shift.endTime}</td>{isManager && <td className="text-end"><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => remove(shift._id)}><i className="bi bi-trash" /></button></td>}</tr>)}{!shifts.length && <tr><td colSpan={4} className="text-center text-muted py-4">No shifts scheduled.</td></tr>}</tbody></table></div></div>}
  </PageContainer>
}
