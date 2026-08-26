import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import doctorApi from "../../api/doctorApi";
import { useDispatch, useSelector } from "react-redux";
import { doctorVisit } from "../../redux/slices/visitSlice";
import AssignVisitModal from "../../components/AssignVisitModal";

const ASSIGN_ROLES = ['admin', 'company_owner', 'hr_manager', 'manager', 'superadmin', 'super_admin'];

function formatDateOfBirth(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
}

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading: visitLoading, error: visitError, lastResult } = useSelector(
    (s) => s.visits
  );
  const role = useSelector((s) => s.auth.user?.role);
  const canAssign = ASSIGN_ROLES.includes(role);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState({
    latitude: "",
    longitude: "",
  });
  const [locationStatus, setLocationStatus] = useState(
    "Requesting live location..."
  );
  const [notes, setNotes] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await doctorApi.getDoctor(id);

        setDoctor(response.doctor || response);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load doctor details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDoctor();
    }
  }, [id]);

  useEffect(() => {
    // Admin/hr_manager/manager don't self check-in, so skip requesting
    // location permission for them — only the assign flow applies.
    if (canAssign) return;

    if (!navigator.geolocation) {
      setLocationStatus(
        "Geolocation is not supported by this browser"
      );
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        setLocationStatus("Live location active");
      },
      (err) => {
        setLocationStatus(
          `Location permission needed: ${err.message}`
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [canAssign]);

  const handleAddVisit = async () => {
    if (!location.latitude || !location.longitude) {
      alert("Current location is not available yet");
      return;
    }

    try {
      const payload = {
        doctorId: id,
        currentLatitude: location.latitude,
        currentLongitude: location.longitude,
        purpose: "field_visit",
        notes,
      };

      await dispatch(doctorVisit(payload)).unwrap();

      alert("Visit recorded successfully");
      setNotes("");
    } catch (err) {
      alert(
        "Unable to record visit: " +
          (err?.message || JSON.stringify(err))
      );
    }
  };

  const hasLocation =
    location.latitude !== "" && location.longitude !== "";

  const mapUrl = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        location.longitude - 0.005
      }%2C${location.latitude - 0.005}%2C${
        location.longitude + 0.005
      }%2C${location.latitude + 0.005}&layer=mapnik&marker=${
        location.latitude
      }%2C${location.longitude}`
    : "";

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>

          <p className="text-muted mt-3 mb-0">
            Loading doctor details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger rounded-4 border-0 shadow-sm">
          <div className="fw-semibold mb-1">
            Unable to load doctor
          </div>

          <div>{error}</div>

          <button
            className="btn btn-outline-danger btn-sm mt-3"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning rounded-4 border-0 shadow-sm">
          Doctor not found.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-4 bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: "55px",
                height: "55px",
                fontSize: "22px",
              }}
            >
              {doctor.name?.charAt(0)?.toUpperCase() || "D"}
            </div>

            <div>
              <h2 className="fw-bold mb-1">
                {doctor.name || "Doctor"}
              </h2>

              <p className="text-muted mb-0">
                Doctor profile and clinic information
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/doctors"
          className="btn btn-outline-secondary rounded-3 px-4"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Doctors
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-person-badge text-primary me-2"></i>
                Doctor Information
              </h5>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Doctor Name
                </small>

                <div className="fw-semibold">
                  {doctor.name || "-"}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Specialty
                </small>

                <div>
                  {doctor.specialty ? (
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">
                      {doctor.specialty}
                    </span>
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Phone
                </small>

                <div className="fw-semibold">
                  {doctor.phone || "-"}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Date of Birth
                </small>
                <div className="fw-semibold">
                  {formatDateOfBirth(doctor.dateOfBirth)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-building text-primary me-2"></i>
                Clinic Information
              </h5>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Clinic Name
                </small>

                <div className="fw-semibold">
                  {doctor.clinicName || "-"}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Address
                </small>

                <div className="fw-semibold">
                  {doctor.address || "-"}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-4">
                  <small className="text-muted d-block">City</small>
                  <div className="fw-semibold">{doctor.city || "-"}</div>
                </div>
                <div className="col-4">
                  <small className="text-muted d-block">District</small>
                  <div className="fw-semibold">{doctor.district || "-"}</div>
                </div>
                <div className="col-4">
                  <small className="text-muted d-block">State</small>
                  <div className="fw-semibold">{doctor.state || "-"}</div>
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Latitude
                </small>

                <div>
                  {doctor.latitude ??
                    doctor.location?.latitude ??
                    "-"}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">
                  Longitude
                </small>

                <div>
                  {doctor.longitude ??
                    doctor.location?.longitude ??
                    "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {(doctor.latitude || doctor.location?.latitude) &&
          (doctor.longitude || doctor.location?.longitude) && (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-geo-alt text-danger me-2"></i>
                    Clinic Location
                  </h5>

                  {(() => {
                    const latitude =
                      doctor.latitude ??
                      doctor.location?.latitude;

                    const longitude =
                      doctor.longitude ??
                      doctor.location?.longitude;

                    const mapUrl =
                      `https://www.openstreetmap.org/export/embed.html?bbox=` +
                      `${Number(longitude) - 0.005}%2C` +
                      `${Number(latitude) - 0.005}%2C` +
                      `${Number(longitude) + 0.005}%2C` +
                      `${Number(latitude) + 0.005}` +
                      `&layer=mapnik&marker=${latitude}%2C${longitude}`;

                    return (
                      <iframe
                        title="Doctor clinic location"
                        src={mapUrl}
                        style={{
                          width: "100%",
                          height: "350px",
                          border: 0,
                          borderRadius: "12px",
                        }}
                        loading="lazy"
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

        {canAssign && (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <h5 className="fw-bold mb-1">
                      <i className="bi bi-person-check text-success me-2"></i>
                      Assign Visit
                    </h5>

                    <p className="text-muted small mb-0">
                      Schedule an employee to visit this doctor on a future date.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-success px-4 py-2 rounded-3 fw-semibold"
                    onClick={() => setShowAssignModal(true)}
                  >
                    <i className="bi bi-calendar-plus me-2"></i>
                    Assign Visit
                  </button>
                </div>

                {assignSuccess && (
                  <div className="alert alert-success mt-3 mb-0 rounded-3">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {assignSuccess}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!canAssign && (
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                  <h5 className="fw-bold mb-1">
                    <i className="bi bi-clipboard-check text-primary me-2"></i>
                    Add Visit
                  </h5>

                  <p className="text-muted small mb-0">
                    Your current location will be checked against the doctor's clinic location.
                  </p>
                </div>
              </div>

              <div className="alert alert-light border rounded-3">
                <div className="d-flex align-items-center">
                  <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                  <span>{locationStatus}</span>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Current Latitude
                  </label>

                  <input
                    className="form-control"
                    value={location.latitude}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Current Longitude
                  </label>

                  <input
                    className="form-control"
                    value={location.longitude}
                    readOnly
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Notes
                </label>

                <textarea
                  className="form-control"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter visit notes"
                />
              </div>

              {hasLocation && (
                <div className="mb-4">
                  <iframe
                    title="Current visit location"
                    src={mapUrl}
                    style={{
                      width: "100%",
                      height: "250px",
                      border: 0,
                      borderRadius: "12px",
                    }}
                    loading="lazy"
                  />
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary px-4 py-2 rounded-3 fw-semibold"
                onClick={handleAddVisit}
                disabled={visitLoading || !hasLocation}
              >
                {visitLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Checking Location...
                  </>
                ) : (
                  <>
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Add Visit
                  </>
                )}
              </button>

              {visitError && (
                <div className="alert alert-danger mt-3 mb-0 rounded-3">
                  {visitError.message ||
                    JSON.stringify(visitError)}
                </div>
              )}

              {lastResult?.message && (
                <div className="alert alert-success mt-3 mb-0 rounded-3">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {lastResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {showAssignModal && (
        <AssignVisitModal
          doctorId={doctor._id}
          targetName={doctor.name}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => setAssignSuccess("Visit assigned successfully.")}
        />
      )}
    </div>
  );
};

export default DoctorDetails;