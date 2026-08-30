import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import userApi from "../../api/userApi";
import organizationApi from "../../api/organizationApi";
import { Link, useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "../../components/ui";

const Profile = () => {
  const auth = useSelector((s) => s.auth);
  const user = auth?.user;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportingLine, setReportingLine] = useState(null);

  const nav = useNavigate();

  const myId = user?.id || user?._id;

  useEffect(() => {
    if (!myId) return;
    organizationApi
      .getOrgChart()
      .then((response) => {
        const people = response.employees || [];
        const me = people.find((person) => String(person._id) === String(myId));
        if (!me) return setReportingLine(null);
        const manager = me.reportingManagerId
          ? people.find((person) => String(person._id) === String(me.reportingManagerId))
          : null;
        const reports = people
          .filter((person) => String(person.reportingManagerId || "") === String(myId))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setReportingLine({ manager, reports });
      })
      .catch(() => setReportingLine(null));
  }, [myId]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id && !user?._id) return;

      setLoading(true);

      try {
        const id = user.id || user._id;
        const data = await userApi.fetchUser(id);
        setProfile(data.user || data);
      } catch (err) {
        console.error("Profile loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const formatRole = (role) => {
    if (!role) return "-";

    return role
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  if (!user) {
    return (
      <div className="container-fluid py-4"><div className="mf-page mf-page--narrow">
          <div className="alert alert-warning border-0 shadow-sm rounded-4">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-warning bg-opacity-25 text-warning d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="bi bi-exclamation-triangle fs-4"></i>
              </div>

              <div>
                <h6 className="fw-bold mb-1">
                  Authentication Required
                </h6>

                <div>
                  Please{" "}
                  <Link
                    to="/login"
                    className="fw-semibold text-decoration-none"
                  >
                    login
                  </Link>{" "}
                  to view your profile.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid py-4"><div className="mf-page mf-page--narrow">
          <div
            className="card border-0 shadow-sm rounded-4"
            style={{ minHeight: "400px" }}
          >
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <div
                className="spinner-border text-primary mb-3"
                style={{ width: "3rem", height: "3rem" }}
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <h5 className="fw-semibold mb-1">
                Loading Profile
              </h5>

              <p className="text-muted mb-0">
                Please wait while we fetch your information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-fluid py-4"><div className="mf-page mf-page--narrow">
          <div className="alert alert-info border-0 shadow-sm rounded-4">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-info-circle fs-3"></i>

              <div>
                <h6 className="fw-bold mb-1">
                  Profile Not Available
                </h6>

                <p className="mb-0 text-muted">
                  We couldn't find your profile information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const p = profile.profile || {};

  // Joining date comes from the offer letter (synced onto the account); the
  // onboarding profile carries prior-experience details.
  const joiningDate =
    profile.joiningDate ||
    p.jobDetails?.startDate ||
    profile.onboardingProfile?.jobDetails?.startDate ||
    null;

  const tenureText = (() => {
    if (!joiningDate) return null;
    const start = new Date(joiningDate);
    if (Number.isNaN(start.getTime())) return null;
    const totalMonths = Math.max(
      0,
      (new Date().getFullYear() - start.getFullYear()) * 12 +
        (new Date().getMonth() - start.getMonth())
    );
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0 && months === 0) return "Joined this month";
    return [years ? `${years} yr${years > 1 ? "s" : ""}` : null, months ? `${months} mo` : null]
      .filter(Boolean)
      .join(" ");
  })();

  const priorExperience = (() => {
    if (profile.experienceType === "fresher") return "Fresher";
    const ob = profile.onboardingProfile || {};
    const parts = [];
    if (ob.totalExperienceYears) parts.push(`${ob.totalExperienceYears} year(s)`);
    if (ob.previousCompany) parts.push(`at ${ob.previousCompany}`);
    if (parts.length) return `Experienced · ${parts.join(" ")}`;
    if (profile.experienceType === "experienced") return "Experienced";
    return null;
  })();

  const initials = (
    profile.name ||
    profile.email ||
    "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  const companyDisplay = profile.companyId
    ? typeof profile.companyId === "object"
      ? profile.companyId.name ||
        profile.companyId._id ||
        "-"
      : profile.companyId
    : "-";

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="My account"
        title="My Profile"
        description="View and manage your personal and professional information."
        actions={
          <button className="btn btn-primary rounded-3 fw-semibold" onClick={() => nav("/profile/edit")}>
            <i className="bi bi-pencil-square me-2"></i> Edit Profile
          </button>
        }
      />

      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div
            className="profile-cover"
            style={{
              height: "150px",
              background:
                "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)",
            }}
          ></div>

          <div className="card-body px-4 px-md-5 pb-4">
            <div className="d-flex flex-column flex-md-row align-items-center align-items-md-end gap-3 profile-header">

              <div
                className="rounded-circle bg-white shadow d-flex align-items-center justify-content-center text-primary fw-bold"
                style={{
                  width: "110px",
                  height: "110px",
                  fontSize: "42px",
                  marginTop: "-55px",
                  border: "5px solid white",
                }}
              >
                {initials}
              </div>

              <div className="flex-grow-1 text-center text-md-start">
                <h3 className="fw-bold mb-1">
                  {profile.name || "User"}
                </h3>

                <p className="text-muted mb-2">
                  <i className="bi bi-envelope me-2"></i>
                  {profile.email || "-"}
                </p>

                <span className="badge bg-primary rounded-pill px-3 py-2">
                  {formatRole(profile.role)}
                </span>
              </div>

              <div className="text-center text-md-end">
                <small className="text-muted d-block mb-1">
                  Company
                </small>

                <span className="fw-semibold">
                  {companyDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">

          <div className="col-lg-4">

            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                    style={{ width: 45, height: 45 }}
                  >
                    <i className="bi bi-person fs-5"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-0">
                      Basic Information
                    </h5>

                    <small className="text-muted">
                      Account details
                    </small>
                  </div>
                </div>

                <div className="profile-info mb-3">
                  <small className="text-muted d-block">
                    Full Name
                  </small>

                  <div className="fw-semibold mt-1">
                    {profile.name || "-"}
                  </div>
                </div>

                <div className="profile-info mb-3">
                  <small className="text-muted d-block">
                    Email Address
                  </small>

                  <div className="fw-semibold text-break mt-1">
                    {profile.email || "-"}
                  </div>
                </div>

                <div className="profile-info mb-3">
                  <small className="text-muted d-block">
                    Mobile Number
                  </small>

                  <div className="fw-semibold mt-1">
                    {profile.mobile || "-"}
                  </div>
                </div>

                <div className="profile-info mb-3">
                  <small className="text-muted d-block">
                    Role
                  </small>

                  <div className="mt-1">
                    <span className="badge bg-light text-dark border rounded-pill px-3">
                      {formatRole(profile.role)}
                    </span>
                  </div>
                </div>

                <div className="profile-info">
                  <small className="text-muted d-block">
                    User ID
                  </small>

                  <div className="small text-muted text-break mt-1">
                    {profile._id || "-"}
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="col-lg-8">

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4 p-md-5">

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                    style={{ width: 45, height: 45 }}
                  >
                    <i className="bi bi-person-vcard fs-5"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-0">
                      Personal Details
                    </h5>

                    <small className="text-muted">
                      Your personal information
                    </small>
                  </div>
                </div>

                <div className="row g-4">

                  <div className="col-md-6">
                    <div className="detail-box">
                      <div className="detail-icon text-primary">
                        <i className="bi bi-person"></i>
                      </div>

                      <div>
                        <small className="text-muted">
                          Father Name
                        </small>

                        <div className="fw-semibold mt-1">
                          {p.fatherName || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="detail-box">
                      <div className="detail-icon text-success">
                        <i className="bi bi-calendar-event"></i>
                      </div>

                      <div>
                        <small className="text-muted">
                          Date of Birth
                        </small>

                        <div className="fw-semibold mt-1">
                          {p.dob
                            ? new Date(
                                p.dob
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="detail-box">
                      <div className="detail-icon text-info">
                        <i className="bi bi-gender-ambiguous"></i>
                      </div>

                      <div>
                        <small className="text-muted">
                          Gender
                        </small>

                        <div className="fw-semibold mt-1 text-capitalize">
                          {p.gender || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="detail-box">
                      <div className="detail-icon text-danger">
                        <i className="bi bi-telephone"></i>
                      </div>

                      <div>
                        <small className="text-muted">
                          Emergency Contact
                        </small>

                        <div className="fw-semibold mt-1">
                          {p.emergencyContact?.name
                            ? `${p.emergencyContact.name} (${p.emergencyContact.phone || "-"})`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="detail-box">
                      <div className="detail-icon text-warning">
                        <i className="bi bi-geo-alt"></i>
                      </div>

                      <div>
                        <small className="text-muted">
                          Current Address
                        </small>

                        <div className="fw-semibold mt-1">
                          {p.currentAddress?.line1
                            ? `${p.currentAddress.line1}${p.currentAddress.city ? `, ${p.currentAddress.city}` : ""}`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mt-4">
              <div className="card-body p-4">

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="rounded-3 bg-purple bg-opacity-10 text-purple d-flex align-items-center justify-content-center"
                    style={{
                      width: 45,
                      height: 45,
                      background: "rgba(14, 116, 144, 0.12)",
                      color: "var(--mf-color-accent)",
                    }}
                  >
                    <i className="bi bi-briefcase fs-5"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-0">
                      Professional Information
                    </h5>

                    <small className="text-muted">
                      Employment details
                    </small>
                  </div>
                </div>

                <div className="row g-3">

                  <div className="col-md-6">
                    <div className="p-3 rounded-3 bg-light">
                      <small className="text-muted d-block">
                        Designation
                      </small>

                      <div className="fw-semibold mt-1">
                        {p.jobDetails?.designation || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 rounded-3 bg-light">
                      <small className="text-muted d-block">
                        Department
                      </small>

                      <div className="fw-semibold mt-1">
                        {p.jobDetails?.department || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 rounded-3 bg-light">
                      <small className="text-muted d-block">
                        Joining Date
                      </small>

                      <div className="fw-semibold mt-1">
                        {joiningDate
                          ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "Not set"}
                        {tenureText && <span className="text-muted fw-normal"> · {tenureText}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 rounded-3 bg-light">
                      <small className="text-muted d-block">
                        Prior Experience
                      </small>

                      <div className="fw-semibold mt-1">
                        {priorExperience || "Not provided"}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {reportingLine && (
            <div className="card border-0 shadow-sm rounded-4 mt-4">
              <div className="card-body p-4">

                <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: 45, height: 45, background: "rgba(13, 148, 136, 0.15)", color: "var(--mf-color-primary)" }}
                    >
                      <i className="bi bi-diagram-3 fs-5"></i>
                    </div>

                    <div>
                      <h5 className="fw-bold mb-0">My Reporting Line</h5>
                      <small className="text-muted">Where you sit in the organization</small>
                    </div>
                  </div>

                  <Link to={`/organization?focus=${profile._id}`} className="btn btn-sm btn-outline-primary rounded-3">
                    Org Chart
                  </Link>
                </div>

                <div className="p-3 rounded-3 bg-light mb-3">
                  <small className="text-muted d-block">Reports to</small>
                  <div className="fw-semibold mt-1">
                    {reportingLine?.manager
                      ? `${reportingLine.manager.name} — ${formatRole(reportingLine.manager.role)}`
                      : "Not assigned"}
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-light">
                  <small className="text-muted d-block mb-1">
                    Direct reports {reportingLine?.reports?.length ? `(${reportingLine.reports.length})` : ""}
                  </small>
                  {reportingLine?.reports?.length ? (
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {reportingLine.reports.map((report) => (
                        <Link
                          key={report._id}
                          to={`/organization?focus=${report._id}`}
                          className="badge bg-white text-dark border rounded-pill px-3 py-2 text-decoration-none"
                        >
                          {report.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="fw-semibold mt-1">None</div>
                  )}
                </div>

              </div>
            </div>
            )}

          </div>

        </div>

        <div className="text-center mt-4">
          <button
            className="btn btn-outline-secondary rounded-3 px-4"
            onClick={() => nav(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>
        </div>

      </div>

      <style>{`
        .profile-page {
          color: #212529;
        }

        .profile-info {
          padding-bottom: 14px;
          border-bottom: 1px solid #f0f0f0;
        }

        .profile-info:last-child {
          border-bottom: 0;
        }

        .detail-box {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          border: 1px solid #edf0f4;
          border-radius: 14px;
          background: #fff;
          transition: all 0.25s ease;
          height: 100%;
        }

        .detail-box:hover {
          transform: translateY(-3px);
          border-color: rgba(13, 148, 136, 0.25);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
        }

        .detail-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 11px;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .profile-page .card {
          transition: box-shadow 0.25s ease;
        }

        .profile-page .card:hover {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07) !important;
        }

        @media (max-width: 767px) {
          .profile-cover {
            height: 120px !important;
          }

          .profile-header {
            align-items: center !important;
          }
        }
      `}</style>
    </PageContainer>
  );
};

export default Profile;