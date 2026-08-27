import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";

import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";
import { logout, clearAuth } from "../redux/slices/authSlice";
import employeeProfileApi from "../api/employeeProfileApi";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const { user, isAuthenticated } = auth;

  const signedIn = Boolean(isAuthenticated || auth?.token);

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const profileRef = useRef(null);
  const navbarRef = useRef(null);

  useEffect(() => {
    let objectUrl = "";

    if (!signedIn || user?.role === "super_admin") {
      return undefined;
    }

    employeeProfileApi
      .getMyProfile()
      .then(async (response) => {
        const profile = response?.profile;

        const photo =
          profile?.documents?.find(
            (document) =>
              document.type === "passportPhoto" ||
              document.documentType === "passportPhoto"
          ) ||
          profile?.profileImage ||
          profile?.profileData?.profileImage;

        const photoUrl =
          typeof photo === "string"
            ? photo
            : photo?.url ||
              photo?.fileUrl ||
              photo?.path ||
              photo?.location ||
              photo?.filePath ||
              photo?.secure_url ||
              photo?.secureUrl;

        if (photoUrl) {
          try {
            const blob =
              await employeeProfileApi.downloadDocument(photoUrl);

            objectUrl = URL.createObjectURL(blob);
            setAvatarUrl(objectUrl);
          } catch (error) {
            console.error("Profile photo download error:", error);
          }
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
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";

    document.documentElement.setAttribute("data-bs-theme", theme);
    document.body.classList.toggle("dark-mode", isDarkMode);
    localStorage.setItem("theme", theme);
  }, [isDarkMode]);

  const closeMenus = () => {
    setOpen(false);
    setProfileOpen(false);
    window.dispatchEvent(new CustomEvent("mediflow:close-sidebar"));
  };

  const toggleNavigation = () => {
    setOpen((value) => !value);
    setProfileOpen(false);
    if (signedIn && user?.role !== "super_admin") {
      window.dispatchEvent(new CustomEvent("mediflow:toggle-sidebar"));
    }
  };

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
      closeMenus();
      navigate("/");
    }
  };

  return (
    <>
      <nav
        ref={navbarRef}
        className="navbar navbar-expand-lg mf-navbar sticky-top"
        style={{
          zIndex: 1100,
          borderBottom: "1px solid var(--mf-border)",
          boxShadow: "var(--mf-shadow-sm)",
        }}
      >
        <div className="container py-1">

          <Link
            to="/"
            className="navbar-brand d-flex align-items-center gap-2"
            onClick={closeMenus}
          >
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, var(--mf-color-primary), var(--mf-color-accent))",
                fontSize: "20px",
              }}
            >
              M
            </div>

            <div className="lh-sm">
              <div
                className="fw-bold text-dark"
                style={{
                  fontSize: "18px",
                  letterSpacing: "-0.3px",
                }}
              >
                MediFlow
              </div>

              <small
                className="text-muted"
                style={{ fontSize: "11px" }}
              >
                Business Management
              </small>
            </div>
          </Link>

          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            aria-controls="mainNavbar"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={toggleNavigation}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`navbar-collapse ${
              open ? "show" : ""
            }`}
            id="mainNavbar"
          >
            <ul className="navbar-nav mx-auto mb-3 mb-lg-0 align-items-lg-center">

              {!signedIn && (
                <>
                  <li className="nav-item">
                    <Link
                      to="/features"
                      className="nav-link px-3 fw-medium"
                      onClick={closeMenus}
                    >
                      <i className="bi bi-grid me-1"></i>
                      Features
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      to="/pricing"
                      className="nav-link px-3 fw-medium"
                      onClick={closeMenus}
                    >
                      <i className="bi bi-tags me-1"></i>
                      Pricing
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      to="/about"
                      className="nav-link px-3 fw-medium"
                      onClick={closeMenus}
                    >
                      <i className="bi bi-info-circle me-1"></i>
                      About
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      to="/contact"
                      className="nav-link px-3 fw-medium"
                      onClick={closeMenus}
                    >
                      <i className="bi bi-envelope me-1"></i>
                      Contact
                    </Link>
                  </li>
                </>
              )}
            </ul>

            <div
              className="d-flex align-items-center gap-2 flex-wrap justify-content-center"
              style={{
                position: "relative",
                zIndex: 3000,
              }}
            >
              <button
                type="button"
                className="btn dark-mode-toggle rounded-circle d-inline-flex align-items-center justify-content-center"
                aria-label={`Switch to ${
                  isDarkMode ? "light" : "dark"
                } mode`}
                aria-pressed={isDarkMode}
                title={`Switch to ${
                  isDarkMode ? "light" : "dark"
                } mode`}
                onClick={() => setIsDarkMode((value) => !value)}
              >
                <i
                  className={`bi bi-${
                    isDarkMode
                      ? "brightness-high-fill"
                      : "moon-stars-fill"
                  }`}
                ></i>
              </button>

              {signedIn ? (
                <>
                  <GlobalSearch />

                  <NotificationBell />

                  <span className="mf-role-badge">
                    <i className="bi bi-person-badge"></i>
                    {formattedRole}
                  </span>

                  <div
                    ref={profileRef}
                    className="position-relative"
                    style={{
                      zIndex: 3001,
                    }}
                  >
                    <button
                      type="button"
                      className="btn p-0 border-0 shadow-none"
                      aria-label="Open profile"
                      onClick={() => {
                        setProfileOpen((value) => !value);
                        setOpen(false);
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="rounded-circle"
                          style={{
                            width: 42,
                            height: 42,
                            objectFit: "cover",
                            border:
                              "2px solid var(--mf-color-primary)",
                          }}
                        />
                      ) : (
                        <span
                          className="rounded-circle text-white d-inline-flex align-items-center justify-content-center fw-bold"
                          style={{
                            width: 42,
                            height: 42,
                            background:
                              "linear-gradient(135deg, var(--mf-color-primary), var(--mf-color-accent))",
                            boxShadow:
                              "0 4px 12px rgba(37,99,235,0.25)",
                          }}
                        >
                          {initials}
                        </span>
                      )}
                    </button>

                    {profileOpen && (
                      <div
                        className="profile-menu position-absolute bg-white rounded-4 shadow-lg border p-3"
                        style={{
                          width: "320px",
                          right: 0,
                          top: "54px",
                          zIndex: 9999,
                          animation:
                            "profileDropdown 0.18s ease-out",
                        }}
                      >
                        <div
                          className="rounded-4 p-3 mb-3 text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--mf-color-primary), var(--mf-color-accent))",
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt="Profile"
                                className="rounded-circle border border-2 border-white"
                                style={{
                                  width: 58,
                                  height: 58,
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span
                                className="rounded-circle bg-white text-primary d-inline-flex align-items-center justify-content-center fw-bold"
                                style={{
                                  width: 58,
                                  height: 58,
                                  fontSize: "21px",
                                }}
                              >
                                {initials}
                              </span>
                            )}

                            <div className="min-width-0">
                              <div className="fw-bold text-truncate">
                                {user?.name || "User"}
                              </div>

                              <div
                                className="small text-white"
                                style={{
                                  opacity: 0.8,
                                }}
                              >
                                {formattedRole}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-1">

                          <div className="d-flex gap-3 mb-3">
                            <div className="text-primary">
                              <i className="bi bi-person fs-5"></i>
                            </div>

                            <div>
                              <small className="text-muted d-block">
                                Name
                              </small>

                              <div className="fw-semibold text-break">
                                {user?.name || "-"}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-3 mb-3">
                            <div className="text-primary">
                              <i className="bi bi-envelope fs-5"></i>
                            </div>

                            <div className="flex-grow-1">
                              <small className="text-muted d-block">
                                Email
                              </small>

                              <div className="text-break">
                                {user?.email || "-"}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-3 mb-3">
                            <div className="text-primary">
                              <i className="bi bi-building fs-5"></i>
                            </div>

                            <div>
                              <small className="text-muted d-block">
                                Company
                              </small>

                              <div className="text-break">
                                {companyDisplay}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-3 mb-3">
                            <div className="text-primary">
                              <i className="bi bi-person-badge fs-5"></i>
                            </div>

                            <div>
                              <small className="text-muted d-block">
                                User ID
                              </small>

                              <div className="small text-break">
                                {user?._id || "-"}
                              </div>
                            </div>
                          </div>

                          <hr />

                          <Link
                            to="/profile"
                            className="btn btn-light border w-100 rounded-3 mb-2"
                            onClick={closeMenus}
                          >
                            <i className="bi bi-person-circle me-2"></i>
                            View Profile
                          </Link>

                          <Link
                            to="/reset-password"
                            className="btn btn-light border w-100 rounded-3 mb-2"
                            onClick={closeMenus}
                          >
                            <i className="bi bi-key me-2"></i>
                            Reset Password
                          </Link>

                          <button
                            type="button"
                            className="btn btn-outline-danger w-100 rounded-3"
                            onClick={handleLogout}
                          >
                            <i className="bi bi-box-arrow-right me-2"></i>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary rounded-3 px-4 shadow-sm"
                  onClick={closeMenus}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <style>
        {`
          .mf-navbar {
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: saturate(180%) blur(10px);
            -webkit-backdrop-filter: saturate(180%) blur(10px);
            border-bottom: 1px solid rgba(15, 23, 42, 0.06);
            box-shadow: 0 4px 24px rgba(15, 23, 42, 0.05);
          }

          body.dark-mode .mf-navbar {
            background: rgba(17, 24, 39, 0.88);
            border-bottom-color: rgba(148, 163, 184, 0.14);
          }

          .mf-role-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.02em;
            color: #fff;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            text-transform: capitalize;
          }

          .navbar .nav-link {
            color: var(--mf-text-muted);
            transition: all 0.2s ease;
            border-radius: var(--mf-radius-sm);
          }

          .navbar .nav-link:hover {
            color: var(--mf-color-primary);
            background: var(--mf-color-primary-subtle);
          }

          .navbar .btn {
            transition: all 0.2s ease;
          }

          .navbar .btn:hover {
            transform: translateY(-1px);
          }

          .dark-mode-toggle {
            width: 42px;
            height: 42px;
            border: 1px solid var(--mf-border);
            background: var(--mf-surface);
            color: var(--mf-text-muted);
            font-size: 18px;
            transition: all 0.2s ease;
          }

          .dark-mode-toggle:hover {
            border-color: var(--mf-color-primary);
            background: var(--mf-color-primary-subtle);
            color: var(--mf-color-primary);
          }

          body.dark-mode .dark-mode-toggle {
            border-color: #4b5563;
            background: #111827;
            color: #fbbf24;
          }

          @keyframes profileDropdown {
            from {
              opacity: 0;
              transform: translateY(-6px) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (max-width: 991px) {
            .navbar-collapse {
              padding: 1rem 0;
            }

            .navbar-nav {
              width: 100%;
            }

            .navbar-nav .nav-link {
              padding: 0.75rem 1rem !important;
            }

            .navbar-collapse > div:last-child {
              padding-top: 0.75rem;
              border-top: 1px solid #eee;
            }
          }

          @media (max-width: 576px) {
            .navbar .container {
              padding-left: 15px;
              padding-right: 15px;
            }

            .navbar-brand small {
              display: none;
            }

            .navbar-brand div:last-child {
              font-size: 17px !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Header;
