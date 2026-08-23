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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)

        const [u, d, m, v, l] = await Promise.all([
          userApi.listUsers(),
          doctorApi.listDoctors(),
          medicalApi.listMedicals(),
          visitApi.listVisits(),
          leaveApi.listLeaves()
        ])

        setCounts({
          users: (u.users || u).length,
          doctors: (d.doctors || d).length,
          medicals: (m.medicals || m).length,
          visits: (v.visits || v).length,
          leaves: (l.leaves || l).length
        })
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
      icon: '👥'
    },
    {
      title: 'Doctors',
      value: counts.doctors,
      icon: '👨‍⚕️'
    },
    {
      title: 'Medicals',
      value: counts.medicals,
      icon: '🏥'
    },
    {
      title: 'Visits',
      value: counts.visits,
      icon: '📍'
    },
    {
      title: 'Leaves',
      value: counts.leaves,
      icon: '📅'
    }
  ]

  return (
    <div className="container-fluid py-4">

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <span className="text-primary fw-semibold small">
            ADMINISTRATION
          </span>

          <h2 className="fw-bold mb-1 mt-1">
            Admin Dashboard
          </h2>

          <p className="text-muted mb-0">
            Monitor your organization's activities and resources.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

      </div>

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
            <div className="card border-0 shadow-sm h-100">

              <div className="card-body p-4">

                <div className="d-flex justify-content-between align-items-start">

                  <div>
                    <p className="text-muted small mb-2">
                      {card.title}
                    </p>

                    <h3 className="fw-bold mb-0">
                      {card.value}
                    </h3>
                  </div>

                  <div
                    className="bg-primary-subtle rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '45px',
                      height: '45px',
                      fontSize: '20px'
                    }}
                  >
                    {card.icon}
                  </div>

                </div>

              </div>

            </div>
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