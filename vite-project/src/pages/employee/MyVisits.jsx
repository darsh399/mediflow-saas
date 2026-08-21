import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllMyVisits } from "../../redux/slices/userSlice";

const MyVisits = () => {
  const dispatch = useDispatch();

  const { items: visits, loading, error } = useSelector(
    (state) => state.users
  );

  useEffect(() => {
    dispatch(getAllMyVisits());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>

          <span className="ms-2 text-muted">
            Loading your visits...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger d-flex align-items-center">
          <div>
            <strong>Unable to load visits.</strong>
            <div className="small mt-1">
              {error?.message || "Something went wrong."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            My Visits
          </h2>

          <p className="text-muted mb-0">
            View all doctor visits completed by you.
          </p>
        </div>

        <div className="mt-3 mt-md-0">
          <span className="badge bg-primary fs-6 px-3 py-2">
            {visits?.length || 0} Visits
          </span>
        </div>
      </div>

      {/* No visits */}
      {!visits || visits.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">

            <div
              className="rounded-circle bg-light d-inline-flex justify-content-center align-items-center mb-3"
              style={{
                width: "70px",
                height: "70px"
              }}
            >
              <span className="fs-2">📋</span>
            </div>

            <h5 className="fw-semibold">
              No visits found
            </h5>

            <p className="text-muted mb-0">
              You haven't recorded any doctor visits yet.
            </p>

          </div>
        </div>
      ) : (

        /* Visits table */
        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white border-bottom py-3">
            <h5 className="mb-0 fw-semibold">
              Visit History
            </h5>
          </div>

          <div className="card-body p-0">

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead className="table-light">

                  <tr>
                    <th className="px-4">#</th>
                    <th>Doctor</th>
                    <th>Medical</th>
                    <th>Visit Date</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {visits.map((visit, index) => (

                    <tr key={visit._id}>

                      <td className="px-4 text-muted">
                        {index + 1}
                      </td>

                      {/* Doctor */}
                      <td>
                        <div className="fw-semibold">
                          {visit.doctorId?.name || "N/A"}
                        </div>

                        {visit.doctorId?.specialization && (
                          <small className="text-muted">
                            {visit.doctorId.specialization}
                          </small>
                        )}
                      </td>

                      {/* Medical */}
                      <td>
                        {visit.medicalId?.name || "N/A"}
                      </td>

                      {/* Date */}
                      <td>
                        {visit.createdAt
                          ? new Date(
                              visit.createdAt
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "N/A"}
                      </td>

                      {/* Location */}
                      <td>

                        {visit.location?.latitude &&
                        visit.location?.longitude ? (
                          <span
                            className="text-muted"
                            title={`${visit.location.latitude}, ${visit.location.longitude}`}
                          >
                            📍{" "}
                            {Number(
                              visit.location.latitude
                            ).toFixed(4)}
                            ,
                            {" "}
                            {Number(
                              visit.location.longitude
                            ).toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-muted">
                            N/A
                          </span>
                        )}

                      </td>

                      {/* Status */}
                      <td>
                        <span className="badge bg-success">
                          Completed
                        </span>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default MyVisits;