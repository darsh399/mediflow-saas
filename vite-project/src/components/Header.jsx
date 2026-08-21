import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";

import NotificationBell from "./NotificationBell";
import { logout, clearAuth } from "../redux/slices/authSlice";
import employeeProfileApi from "../api/employeeProfileApi";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const { user, isAuthenticated } = auth;
console.log(user, 'in header')
  const signedIn = Boolean(isAuthenticated || auth?.token);
 
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  const profileRef = useRef(null);

  useEffect(() => {
    let objectUrl = "";

    if (!signedIn || user?.role === "super_admin") {
      return undefined;
    }

    employeeProfileApi
      .getMyProfile()
      .then(async (response) => {
        const photo = response.profile?.documents?.find(
          (document) => document.type === "passportPhoto"
        );

        if (photo?.url) {
          const blob =
            await employeeProfileApi.downloadDocument(photo.url);

          objectUrl = URL.createObjectURL(blob);
          setAvatarUrl(objectUrl);
        }
      })
      .catch((error) => {
        console.error("Profile photo loading error:", error);
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [signedIn, user?.role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const initials = (
    user?.name ||
    user?.email ||
    "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  const formattedRole = user?.role
    ? user.role
        .split("_")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ")
    : "-";

  const companyDisplay = user?.companyId
    ? typeof user.companyId === "object"
      ? user.companyId.name ||
        user.companyId._id ||
        "-"
      : user.companyId
    : "Product Owner";

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(clearAuth());
      setProfileOpen(false);
      setOpen(false);
      navigate("/");
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top"
      style={{
        zIndex: 1100,
      }}
    >
      <div className="container">
        <Link
          to="/"
          className="navbar-brand d-flex align-items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <div
            className="d-flex align-items-center justify-content-center bg-primary text-white rounded-3 fw-bold"
            style={{
              width: "42px",
              height: "42px",
            }}
          >
            M
          </div>

          <div className="lh-sm">
            <div className="fw-bold text-dark">
              MediFlow
            </div>

            <small className="text-secondary">
              Business Management
            </small>
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNavbar"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="navbar-collapse"
          id="mainNavbar"
          style={{
            display: open ? "flex" : undefined,
            alignItems: "center",
          }}
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                to="/"
                className="nav-link px-3"
                onClick={() => setOpen(false)}
              >
                Home
              </Link>
            </li>

            {!signedIn && (
              <>
                <li className="nav-item">
                  <Link
                    to="/features"
                    className="nav-link px-3"
                    onClick={() => setOpen(false)}
                  >
                    Features
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/pricing"
                    className="nav-link px-3"
                    onClick={() => setOpen(false)}
                  >
                    Pricing
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/about"
                    className="nav-link px-3"
                    onClick={() => setOpen(false)}
                  >
                    About
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div
            className="d-flex align-items-center gap-2"
            style={{
              position: "relative",
              zIndex: 3000,
            }}
          >
            {signedIn ? (
              <>
                <NotificationBell />

                <span
                  className="badge bg-dark"
                  style={{
                    fontSize: "12px",
                    padding: "8px 10px",
                  }}
                >
                  {user?.role || "NO ROLE"}
                </span>

                {user?.role === "super_admin" && (
                  <Link
                    to="/superadmin/dashboard"
                    className="btn btn-primary"
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}

                {user?.role === "company_owner" && (
                  <Link
                    to="/admin"
                    className="btn btn-primary"
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}

                <div
                  ref={profileRef}
                  className="position-relative"
                  style={{
                    zIndex: 3001,
                  }}
                >
                  <button
                    type="button"
                    className="btn p-0 border-0"
                    aria-label="Open profile"
                    onClick={() =>
                      setProfileOpen((value) => !value)
                    }
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="rounded-circle"
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: 40,
                          height: 40,
                        }}
                      >
                        {initials}
                      </span>
                    )}
                  </button>

                  {profileOpen && (
                    <div
                      className="position-absolute bg-white border rounded shadow p-3"
                      style={{
                        width: "300px",
                        right: 0,
                        top: "50px",
                        zIndex: 9999,
                      }}
                    >
                      <div className="d-flex align-items-center gap-3 mb-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Profile"
                            className="rounded-circle"
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span
                            className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: 50,
                              height: 50,
                            }}
                          >
                            {initials}
                          </span>
                        )}

                        <div>
                          <div className="fw-bold">
                            {user?.name || "User"}
                          </div>

                          <div className="small text-muted">
                            {user?.email || "-"}
                          </div>
                        </div>
                      </div>

                      <hr />

                      <div className="mb-2">
                        <small className="text-muted">
                          Name
                        </small>

                        <div className="fw-semibold">
                          {user?.name || "-"}
                        </div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">
                          Email
                        </small>

                        <div className="text-break">
                          {user?.email || "-"}
                        </div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">
                          Role
                        </small>

                        <div>
                          {formattedRole}
                        </div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">
                          Company
                        </small>

                        <div className="text-break">
                          {companyDisplay}
                        </div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">
                          User ID
                        </small>

                        <div className="small text-break">
                          {user?._id || "-"}
                        </div>
                      </div>

                      <hr />

                      <Link
                        to="/profile"
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => {
                          setProfileOpen(false);
                          setOpen(false);
                        }}
                      >
                        View Profile
                      </Link>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm w-100 mt-2"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline-primary px-4"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="btn btn-primary px-4"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;