import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMedicals,
  deleteMedical,
} from "../../redux/slices/medicalSlice";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../../components/SearchBar";

const Medicals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items = [], loading, error } = useSelector(
    (state) => state.medicals
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(fetchMedicals());
  }, [dispatch, refreshKey]);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this medical/shop?")) return;

    dispatch(deleteMedical(id)).then((result) => {
      if (!result?.error) {
        setRefreshKey((k) => k + 1);
      }
    });
  };

  const filteredMedicals = items.filter((medical) => {
    const searchValue = q.toLowerCase().trim();

    const name = medical?.name?.toLowerCase() || "";
    const contactPerson =
      medical?.contactPerson?.toLowerCase() || "";
    const city = medical?.city?.toLowerCase() || "";
    const mobile = medical?.mobile?.toLowerCase() || "";

    return (
      name.includes(searchValue) ||
      contactPerson.includes(searchValue) ||
      city.includes(searchValue) ||
      mobile.includes(searchValue)
    );
  });

  return (
    <div className="container-fluid py-4">

      {/* ================= HEADER ================= */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

        <div>

          {/* Back Button */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-3 mb-3"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>

          <div className="d-flex align-items-center gap-2 mb-1">

            <div
              className="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white"
              style={{
                width: "46px",
                height: "46px",
              }}
            >
              <i className="bi bi-shop fs-4"></i>
            </div>

            <h2 className="fw-bold mb-0">
              Medicals / Shops
            </h2>

          </div>

          <p className="text-muted mb-0 ms-md-5">
            Manage medical shops and their contact information.
          </p>

        </div>

        <Link
          className="btn btn-primary px-4 py-2 rounded-3 fw-semibold"
          to="/admin/medicals/add"
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Medical
        </Link>

      </div>

      {/* ================= STATISTICS ================= */}
      <div className="row g-3 mb-4">

        {/* Total Medicals */}
        <div className="col-sm-6 col-xl-3">

          <div className="card border-0 shadow-sm rounded-4 h-100">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-start">

                <div>

                  <p className="text-muted mb-1 small fw-semibold">
                    Total Medicals
                  </p>

                  <h3 className="fw-bold mb-0">
                    {items.length}
                  </h3>

                </div>

                <div
                  className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                  style={{
                    width: "45px",
                    height: "45px",
                  }}
                >
                  <i className="bi bi-shop fs-5"></i>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Showing */}
        <div className="col-sm-6 col-xl-3">

          <div className="card border-0 shadow-sm rounded-4 h-100">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-start">

                <div>

                  <p className="text-muted mb-1 small fw-semibold">
                    Showing
                  </p>

                  <h3 className="fw-bold mb-0">
                    {filteredMedicals.length}
                  </h3>

                </div>

                <div
                  className="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                  style={{
                    width: "45px",
                    height: "45px",
                  }}
                >
                  <i className="bi bi-search fs-5"></i>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ================= MAIN CARD ================= */}
      <div className="card border-0 shadow-sm rounded-4">

        <div className="card-body p-4">

          {/* ================= CARD HEADER ================= */}
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

            <div>

              <h5 className="fw-bold mb-1">
                Medical Directory
              </h5>

              <p className="text-muted small mb-0">
                Search and manage registered medical shops.
              </p>

            </div>

            <div className="search-bar-wrap">

              <SearchBar
                value={q}
                onChange={setQ}
                placeholder="Search by name, contact, city or phone"
              />

            </div>

          </div>

          {/* ================= LOADING ================= */}
          {loading && (
            <div className="text-center py-5">

              <div
                className="spinner-border text-primary mb-3"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <div className="text-muted">
                Loading medicals...
              </div>

            </div>
          )}

          {/* ================= ERROR ================= */}
          {error && (
            <div className="alert alert-danger border-0 rounded-3 d-flex align-items-center">

              <i className="bi bi-exclamation-triangle-fill me-2"></i>

              <div>
                {error?.message || JSON.stringify(error)}
              </div>

            </div>
          )}

          {/* ================= EMPTY ================= */}
          {!loading &&
            !error &&
            filteredMedicals.length === 0 && (
              <div className="text-center py-5">

                <div
                  className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "75px",
                    height: "75px",
                  }}
                >
                  <i className="bi bi-shop-window fs-2 text-muted"></i>
                </div>

                <h5 className="fw-bold">
                  No medicals found
                </h5>

                <p className="text-muted mb-3">

                  {q
                    ? "Try searching with a different medical name, contact, city or phone."
                    : "No medical shops have been added yet."}

                </p>

                {!q && (
                  <Link
                    to="/admin/medicals/add"
                    className="btn btn-primary rounded-3"
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Your First Medical
                  </Link>
                )}

                {q && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3"
                    onClick={() => setQ("")}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Clear Search
                  </button>
                )}

              </div>
            )}

          {/* ================= TABLE ================= */}
          {!loading &&
            !error &&
            filteredMedicals.length > 0 && (
              <div className="table-responsive">

                <table className="table align-middle mb-0 medicals-table">

                  <thead>

                    <tr className="border-bottom">

                      <th className="py-3 text-muted small text-uppercase">
                        Medical / Shop
                      </th>

                      <th className="py-3 text-muted small text-uppercase">
                        Contact Person
                      </th>

                      <th className="py-3 text-muted small text-uppercase">
                        City
                      </th>

                      <th className="py-3 text-muted small text-uppercase">
                        Phone
                      </th>

                      <th className="py-3 text-muted small text-uppercase text-end">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredMedicals.map((medical) => (

                      <tr key={medical._id}>

                        {/* ================= MEDICAL ================= */}
                        <td className="py-3">

                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold"
                              style={{
                                width: "44px",
                                height: "44px",
                                minWidth: "44px",
                              }}
                            >
                              <i className="bi bi-shop"></i>
                            </div>

                            <div>

                              <div className="fw-semibold">
                                {medical?.name || "N/A"}
                              </div>

                              <small className="text-muted">
                                Medical / Pharmacy
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* ================= CONTACT PERSON ================= */}
                        <td className="py-3">

                          {medical?.contactPerson ? (
                            <div className="d-flex align-items-center gap-2">

                              <i className="bi bi-person text-primary"></i>

                              <span>
                                {medical.contactPerson}
                              </span>

                            </div>
                          ) : (
                            <span className="text-muted">
                              N/A
                            </span>
                          )}

                        </td>

                        {/* ================= CITY ================= */}
                        <td className="py-3">

                          {medical?.city ? (
                            <div className="d-flex align-items-center gap-2">

                              <i className="bi bi-geo-alt text-danger"></i>

                              <span>
                                {medical.city}
                              </span>

                            </div>
                          ) : (
                            <span className="text-muted">
                              N/A
                            </span>
                          )}

                        </td>

                        {/* ================= PHONE ================= */}
                        <td className="py-3">

                          {medical?.mobile ? (
                            <div className="d-flex align-items-center gap-2">

                              <i className="bi bi-telephone text-success"></i>

                              <span>
                                {medical.mobile}
                              </span>

                            </div>
                          ) : (
                            <span className="text-muted">
                              N/A
                            </span>
                          )}

                        </td>

                     
                        <td className="py-3 text-end">

                          <div className="d-flex justify-content-end gap-2">

                            <Link
                              to={`/medicals/${medical._id}`}
                              className="btn btn-sm btn-outline-primary rounded-3 px-3"
                            >
                              <i className="bi bi-eye me-1"></i>
                              View
                            </Link>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-3 px-3"
                              onClick={() =>
                                handleDelete(medical._id)
                              }
                            >
                              <i className="bi bi-trash me-1"></i>
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            )}

        </div>

      </div>

      {/* ================= STYLES ================= */}
      <style>
        {`
          .card {
            transition: all 0.25s ease;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .table tbody tr {
            transition: background-color 0.2s ease;
          }

          .table tbody tr:hover {
            background-color: rgba(37, 99, 235, 0.035);
          }

          .btn {
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            /* Needs to out-specificity styles/ui-system.css's
               .table-responsive > .table min-width rule (0,2,0),
               otherwise this override is silently ignored. */
            .table-responsive > .table.medicals-table {
              min-width: 850px;
            }
          }
        `}
      </style>

    </div>
  );
};

export default Medicals;