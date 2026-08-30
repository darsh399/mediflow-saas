import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import userApi from '../../api/userApi'
import { PageContainer, PageHeader, Breadcrumbs } from '../../components/ui'

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'mr', label: 'MR' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
  { value: 'hr_manager', label: 'HR Manager' },
]

const errorMessage = (error) => error?.response?.data?.message || error?.message || 'Unable to create employee'

const AddEmployee = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', personalEmail: '', mobile: '', role: 'employee', reportingManagerId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [colleagues, setColleagues] = useState([])
  const nav = useNavigate()

  useEffect(() => {
    userApi.listUsers()
      .then((response) => setColleagues((response.users || []).filter((user) => user.active !== false)))
      .catch(() => setColleagues([]))
  }, [])

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      const response = await userApi.createUser({
        name,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        personalEmail: form.personalEmail.trim(),
        mobile: form.mobile.trim(),
        role: form.role,
        ...(form.reportingManagerId ? { reportingManagerId: form.reportingManagerId } : {}),
      })
      setResult(response)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const credentials = result.generatedCredentials
    return (
      <PageContainer width="narrow">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5 text-center">
            <div className="mx-auto mb-3 rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: 70, height: 70, fontSize: 28 }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h4 className="fw-bold mb-2">Employee account created</h4>
            <p className="text-muted">{result.user?.name} has been added to your company.</p>

            {credentials && (
              <div className="alert alert-info text-start rounded-3 mt-3">
                <div className="mb-2"><strong>Company Login ID:</strong> {credentials.companyEmail}</div>
                <div>
                  {credentials.emailSent
                    ? <><i className="bi bi-envelope-check me-1"></i> The login ID and a temporary password were emailed to {form.personalEmail}.</>
                    : <><i className="bi bi-exclamation-triangle me-1"></i> The account was created, but the onboarding email could not be delivered. Please share the login ID with the employee and use "Forgot Password" to issue new credentials.</>}
                </div>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center mt-4">
              <button type="button" className="btn btn-outline-secondary" onClick={() => { setResult(null); setForm({ firstName: '', lastName: '', personalEmail: '', mobile: '', role: 'employee', reportingManagerId: '' }) }}>
                Add Another Employee
              </button>
              <button type="button" className="btn btn-primary" onClick={() => nav('/users')}>
                Go to Employee List
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer width="narrow">
      <Breadcrumbs items={[{ label: 'Employees', to: '/users' }, { label: 'Add Employee' }]} />
      <PageHeader eyebrow="People" title="Add Employee" description="A company login email and a secure temporary password will be generated automatically and emailed to the employee." />

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="card border-0 shadow-sm" onSubmit={handleSubmit}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">First Name</label>
              <input required name="firstName" value={form.firstName} onChange={handleChange} className="form-control" placeholder="Rahul" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Last Name</label>
              <input required name="lastName" value={form.lastName} onChange={handleChange} className="form-control" placeholder="Sharma" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Personal Email</label>
              <input required type="email" name="personalEmail" value={form.personalEmail} onChange={handleChange} className="form-control" placeholder="rahul.personal@gmail.com" />
              <small className="text-muted">Onboarding credentials (company login ID + temporary password) are sent here — this is not the employee's MediFlow login.</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Mobile</label>
              <input name="mobile" value={form.mobile} onChange={handleChange} className="form-control" placeholder="9999999999" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="form-select">
                {ROLES.map((role) => <option value={role.value} key={role.value}>{role.label}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Reporting Manager <span className="text-muted fw-normal">(optional)</span></label>
              <select name="reportingManagerId" value={form.reportingManagerId} onChange={handleChange} className="form-select">
                <option value="">No reporting manager</option>
                {colleagues.map((colleague) => (
                  <option value={colleague._id} key={colleague._id}>
                    {colleague.name} — {String(colleague.role || '').replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <small className="text-muted">Who this employee reports to. You can change this later from the employee's profile.</small>
            </div>
          </div>

          <div className="alert alert-light border mt-4 mb-0 small">
            <i className="bi bi-info-circle me-1"></i>
            The company login email will look like <code>{(form.firstName || 'first').toLowerCase()}.{(form.lastName || 'last').toLowerCase()}@yourcompanydomain</code> — the exact address is confirmed once the account is created.
          </div>

          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}

export default AddEmployee
