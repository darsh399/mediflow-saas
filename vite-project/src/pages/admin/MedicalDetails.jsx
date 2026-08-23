import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import medicalApi from "../../api/medicalApi";
import { useDispatch, useSelector } from "react-redux";
import { doctorVisit } from "../../redux/slices/visitSlice";

const MedicalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    loading: visitLoading,
    error: visitError,
    lastResult,
  } = useSelector((s) => s.visits);

  const [medical, setMedical] = useState(null);
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

  useEffect(() => {
    const loadMedical = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await medicalApi.getMedical(id);

        setMedical(response.medical || response);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load medical details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadMedical();
    }
  }, [id]);

  useEffect(() => {
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
  }, []);

  const handleAddVisit = async () => {
    if (!location.latitude || !location.longitude) {
      alert("Current location is not available yet");
      return;
    }

    try {
      const payload = {
        medicalId: id,
        currentLatitude: location.latitude,
        currentLongitude: location.longitude,
        purpose: "medical_visit",
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

  const latitude =
    medical?.latitude ?? medical?.location?.latitude;

  const longitude =
    medical?.longitude ?? medical?.location?.longitude;

  const hasMedicalLocation =
    latitude !== undefined &&
    latitude !== null &&
    latitude !== "" &&
    longitude !== undefined &&
    longitude !== null &&
    longitude !== "";

  const hasCurrentLocation =
    location.latitude !== "" &&
    location.longitude !== "";

  const medicalMapUrl = hasMedicalLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        Number(longitude) - 0.005
      }%2C${
        Number(latitude) - 0.005
      }%2C${
        Number(longitude) + 0.005
      }%2C${
        Number(latitude) + 0.005
      }&layer=mapnik&marker=${
        latitude
      }%2C${longitude}`
    : "";

  const currentMapUrl = hasCurrentLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        Number(location.longitude) - 0.005
      }%2C${
        Number(location.latitude) - 0.005
      }%2C${
        Number(location.longitude) + 0.005
      }%2C${
        Number(location.latitude) + 0.005
      }&layer=mapnik&marker=${
        location.latitude
      }%2C${location.longitude}`
    : "";

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="text-muted mt-3 mb-0">
            Loading medical details...
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
            Unable to load medical
          </div>

          <div>{error}</div>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm mt-3"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!medical) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning rounded-4 border-0 shadow-sm">
          Medical / shop not found.
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid py-4"
      style={{
        backgroundColor: "#f8f9fc",
        minHeight: "100vh",
      }}
    >
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
              <i className="bi bi-shop"></i>
            </div>

            <div>
              <h2 className="fw-bold mb-1">
                {medical.name || "Medical / Shop"}
              </h2>

              <p className="text-muted mb-0">
                Medical shop profile and business information
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/medicals"
          className="btn btn-outline-secondary rounded-3 px-4"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Medicals
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-shop text-primary me-2"></i>
                Medical Information
              </h5>

              <div className="mb-4">
                <small className="text-muted d-block mb-1">
                  Medical / Shop Name
                </small>

                <div className="fw-semibold fs-5">
                  {medical.name || "-"}
                </div>
              </div>

              <div className="mb-4">
                <small className="text-muted d-block mb-1">
                  Contact Person
                </small>

                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "38px",
                      height: "38px",
                      backgroundColor: "#e7f1ff",
                      color: "#0d6efd",
                    }}
                  >
                    <i className="bi bi-person"></i>
                  </div>

                  <span className="fw-semibold">
                    {medical.contactPerson || "-"}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <small className="text-muted d-block mb-1">
                  Mobile Number
                </small>

                {medical.mobile ? (
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "38px",
                        height: "38px",
                        backgroundColor: "#eafaf1",
                        color: "#198754",
                      }}
                    >
                      <i className="bi bi-telephone-fill"></i>
                    </div>

                    <span className="fw-semibold">
                      {medical.mobile}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </div>

              <div>
                <small className="text-muted d-block mb-1">
                  Email
                </small>

                {medical.email ? (
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "38px",
                        height: "38px",
                        backgroundColor: "#fff4e5",
                        color: "#fd7e14",
                      }}
                    >
                      <i className="bi bi-envelope-fill"></i>
                    </div>

                    <span className="fw-semibold">
                      {medical.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-geo-alt text-danger me-2"></i>
                Address Information
              </h5>

              <div className="mb-4">
                <small className="text-muted d-block mb-1">
                  Address
                </small>

                <div className="fw-semibold">
                  {medical.address || "-"}
                </div>
              </div>

              <div className="mb-4">
                <small className="text-muted d-block mb-1">
                  Area
                </small>

                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-signpost-2 text-primary"></i>

                  <span className="fw-semibold">
                    {medical.area || "-"}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <small className="text-muted d-block mb-1">
                  City
                </small>

                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-building text-primary"></i>

                  <span className="fw-semibold">
                    {medical.city || "-"}
                  </span>
                </div>
              </div>

              <div>
                <small className="text-muted d-block mb-1">
                  Location Status
                </small>

                {hasMedicalLocation ? (
                  <span className="badge rounded-pill px-3 py-2 bg-success-subtle text-success">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Location Available
                  </span>
                ) : (
                  <span className="badge rounded-pill px-3 py-2 bg-secondary-subtle text-secondary">
                    <i className="bi bi-x-circle me-1"></i>
                    Location Not Available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-crosshair text-primary me-2"></i>
                Location Coordinates
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 rounded-3 bg-light">
                    <small className="text-muted d-block mb-1">
                      Latitude
                    </small>

                    <div className="fw-semibold">
                      {latitude ?? "-"}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 rounded-3 bg-light">
                    <small className="text-muted d-block mb-1">
                      Longitude
                    </small>

                    <div className="fw-semibold">
                      {longitude ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasMedicalLocation && (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">
                      <i className="bi bi-geo-alt text-danger me-2"></i>
                      Medical Location
                    </h5>

                    <p className="text-muted small mb-0">
                      Registered location of the medical / shop
                    </p>
                  </div>

                  <span
                    className="badge rounded-pill px-3 py-2"
                    style={{
                      backgroundColor: "#eafaf1",
                      color: "#198754",
                    }}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Location Verified
                  </span>
                </div>

                <iframe
                  title="Medical shop location"
                  src={medicalMapUrl}
                  style={{
                    width: "100%",
                    height: "350px",
                    border: 0,
                    borderRadius: "12px",
                  }}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}

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
                    Your current location will be checked against
                    the medical shop location.
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

              {hasCurrentLocation && (
                <div className="mb-4">
                  <iframe
                    title="Current visit location"
                    src={currentMapUrl}
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
                disabled={
                  visitLoading ||
                  !hasCurrentLocation ||
                  !hasMedicalLocation
                }
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

              {!hasMedicalLocation && (
                <div className="alert alert-warning mt-3 mb-0 rounded-3">
                  Medical location is not available. Visit cannot
                  be recorded.
                </div>
              )}

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

        <div className="col-12">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "45px",
                        height: "45px",
                        backgroundColor: "#e7f1ff",
                      }}
                    >
                      <i className="bi bi-shop text-primary fs-5"></i>
                    </div>

                    <div>
                      <div className="text-muted small">
                        Business Type
                      </div>

                      <div className="fw-bold">
                        Medical / Pharmacy
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "45px",
                        height: "45px",
                        backgroundColor: "#eafaf1",
                      }}
                    >
                      <i className="bi bi-person-check text-success fs-5"></i>
                    </div>

                    <div>
                      <div className="text-muted small">
                        Contact Person
                      </div>

                      <div className="fw-bold">
                        {medical.contactPerson ||
                          "Not Available"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "45px",
                        height: "45px",
                        backgroundColor: "#fff4e5",
                      }}
                    >
                      <i className="bi bi-geo-alt text-warning fs-5"></i>
                    </div>

                    <div>
                      <div className="text-muted small">
                        Location Tracking
                      </div>

                      <div
                        className={`fs-6 fw-bold ${
                          hasMedicalLocation
                            ? "text-success"
                            : "text-muted"
                        }`}
                      >
                        {hasMedicalLocation
                          ? "Enabled"
                          : "Not Available"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .card {
            transition: all 0.25s ease;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .btn {
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            iframe {
              height: 280px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default MedicalDetails;