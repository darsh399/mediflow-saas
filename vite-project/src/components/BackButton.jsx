import { useNavigate } from 'react-router-dom'

const BackButton = ({ fallback = '/superadmin/dashboard', className = 'btn btn-sm btn-outline-secondary me-2' }) => {
  const navigate = useNavigate()
  const goBack = () => {
    // Navigate to a stable fallback to avoid hitting a stale or external history entry
    navigate(fallback)
  }
  return (
    <button type="button" className={className} onClick={goBack}>
      Back
    </button>
  )
}

export default BackButton
