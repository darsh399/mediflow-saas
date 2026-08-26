import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import userApi from '../../api/userApi'
import doctorApi from '../../api/doctorApi'
import medicalApi from '../../api/medicalApi'
import visitApi from '../../api/visitApi'
import leaveApi from '../../api/leaveApi'
import { PageHeader, StatCard } from '../../components/ui'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const AdminDashboard = () => {
  const navigate = useNavigate()

  const [counts, setCounts] = useState({
    users: 0,
    doctors: 0,
    medicals: 0,
    visits: 0,
    leaves: 0
  })

  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})

  const countFromResponse = (response, key) => {
    if (Number.isFinite(response?.pagination?.total)) return response.pagination.total
    if (Array.isArray(response?.[key])) return response[key].length
    if (Array.isArray(response)) return response.length
    return 0
  }

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)

        const requests = [
          userApi.listUsers(),
          doctorApi.listDoctors(),
          medicalApi.listMedicals(),
          visitApi.listVisits(),
          leaveApi.listLeaves()
        ]
        const results = await Promise.allSettled(requests)
        const keys = ['users', 'doctors', 'medicals', 'visits', 'leaves']
        const nextErrors = {}
        const nextCounts = {}
        results.forEach((result, index) => {
          const key = keys[index]
          if (result.status === 'fulfilled') nextCounts[key] = countFromResponse(result.value, key)
          else nextErrors[key] = result.reason?.response?.data?.message || `Unable to load ${key}`
        })
        setCounts(current => ({ ...current, ...nextCounts }))
        setErrors(nextErrors)
      } catch (err) {
        console.error('Dashboard API error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const chartData = {
    labels: [
      'Users',
      'Doctors',
      'Medicals',
      'Visits',
      'Leaves'
    ],
    datasets: [
      {
        label: 'Total',
        data: [
          counts.users,
          counts.doctors,
          counts.medicals,
          counts.visits,
          counts.leaves
        ],
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'System Overview'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  }

  const dashboardCards = [
    {
      title: 'Users',
      value: counts.users,
      icon: 'bi-people',
      iconBg: 'var(--mf-color-primary-subtle)',
      iconColor: 'var(--mf-color-primary)'
    },
    {
      title: 'Doctors',
      value: counts.doctors,
      icon: 'bi-heart-pulse',
      iconBg: 'var(--mf-color-danger-subtle)',
      iconColor: 'var(--mf-color-danger)'
    },
    {
      title: 'Medicals',
      value: counts.medicals,
      icon: 'bi-hospital',
      iconBg: 'var(--mf-color-info-subtle)',
      iconColor: 'var(--mf-color-info)'
    },
    {
      title: 'Visits',
      value: counts.visits,
      icon: 'bi-geo-alt',
      iconBg: 'var(--mf-color-success-subtle)',
      iconColor: 'var(--mf-color-success)'
    },
    {
      title: 'Leaves',
      value: counts.leaves,
      icon: 'bi-calendar3',
      iconBg: 'var(--mf-color-warning-subtle)',
      iconColor: 'var(--mf-color-warning)'
    }
  ]

  return (
    <div className="container-fluid py-4">

      <PageHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="Monitor your organization's activities and resources."
        actions={
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back
          </button>
        }
      />

      {loading && (
        <div className="alert alert-info">
          Loading dashboard...
        </div>
      )}

      <div className="row g-3 mb-4">

        {dashboardCards.map(card => (
          <div
            className="col-xl col-lg-4 col-md-6"
            key={card.title}
          >
            <StatCard
              label={card.title}
              value={card.value}
              error={errors[card.title.toLowerCase()]}
              icon={card.icon}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
            />
          </div>
        ))}

      </div>

      <div className="row g-4">

        <div className="col-lg-8">

          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white border-0 p-4">

              <h5 className="fw-bold mb-1">
                System Overview
              </h5>

              <p className="text-muted small mb-0">
                Overview of users, doctors, medicals, visits and leaves.
              </p>

            </div>

            <div className="card-body">

              <div
                style={{
                  height: '320px'
                }}
              >
                <Bar
                  data={chartData}
                  options={chartOptions}
                />
              </div>

            </div>

          </div>

        </div>

        <div className="col-lg-4">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-header bg-white border-0 p-4">

              <h5 className="fw-bold mb-1">
                Quick Summary
              </h5>

              <p className="text-muted small mb-0">
                Current system statistics
              </p>

            </div>

            <div className="card-body">

              <div className="d-flex justify-content-between border-bottom py-3">
                <span className="text-muted">
                  Total Users
                </span>

                <strong>
                  {counts.users}
                </strong>
              </div>

              <div className="d-flex justify-content-between border-bottom py-3">
                <span className="text-muted">
                  Doctors
                </span>

                <strong>
                  {counts.doctors}
                </strong>
              </div>

              <div className="d-flex justify-content-between border-bottom py-3">
                <span className="text-muted">
                  Medical Facilities
                </span>

                <strong>
                  {counts.medicals}
                </strong>
              </div>

              <div className="d-flex justify-content-between border-bottom py-3">
                <span className="text-muted">
                  Total Visits
                </span>

                <strong>
                  {counts.visits}
                </strong>
              </div>

              <div className="d-flex justify-content-between py-3">
                <span className="text-muted">
                  Leave Requests
                </span>

                <strong>
                  {counts.leaves}
                </strong>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default AdminDashboard