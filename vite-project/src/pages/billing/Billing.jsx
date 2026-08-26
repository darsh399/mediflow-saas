import { useEffect, useState } from "react";
import billingApi from "../../api/billingApi";

const PLAN_LABELS = {
  FREE: "Free",
  TRIAL: "Trial",
  BASIC: "Basic",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
  "6_MONTHS": "6 Months",
  "1_YEAR": "1 Year",
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getStatusStyle = (status) => {
  switch (status) {
    case "ACTIVE": return { backgroundColor: "#e8f8ef", color: "#198754" };
    case "TRIAL": return { backgroundColor: "#e5f0ff", color: "var(--mf-color-primary)" };
    case "GRACE": return { backgroundColor: "#fff4e5", color: "#fd7e14" };
    default: return { backgroundColor: "#fdecec", color: "#dc3545" };
  }
};

const Billing = () => {
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await billingApi.getMySubscription();
        if (cancelled) return;
        setCompany(response.company);
        setSubscription(response.subscription);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Unable to load billing information");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const daysRemaining = subscription?.endDate
    ? Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  if (loading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3"></div>
            <h6 className="text-muted mb-0">Loading billing information...</h6>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-body p-4 p-lg-5 text-white" style={{ background: "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)" }}>
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <i className="bi bi-credit-card fs-3"></i>
              </div>
              <div>
                <span className="small opacity-75">ACCOUNT</span>
                <h2 className="fw-bold mb-0">Billing &amp; Subscription</h2>
              </div>
            </div>
            <p className="mb-0 opacity-75 mt-3">View your company's current plan and subscription status.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {!error && !subscription ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <i className="bi bi-credit-card-2-front text-muted fs-1"></i>
              <h5 className="fw-bold mt-3">No subscription on file</h5>
              <p className="text-muted mb-0">Contact your MediFlow administrator to set up a subscription plan.</p>
            </div>
          </div>
        ) : !error && (
          <div className="row g-4">

            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-0 p-4">
                  <h5 className="fw-bold mb-0">Current Plan</h5>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                    <div>
                      <div className="text-muted small">Plan</div>
                      <h3 className="fw-bold mb-0">{PLAN_LABELS[subscription.plan] || subscription.plan}</h3>
                    </div>
                    <span className="badge rounded-pill px-3 py-2" style={getStatusStyle(subscription.status)}>{subscription.status}</span>
                  </div>

                  <div className="row g-4">
                    <div className="col-sm-6">
                      <div className="text-muted small">Start Date</div>
                      <div className="fw-semibold">{formatDate(subscription.startDate)}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted small">End Date</div>
                      <div className="fw-semibold">{formatDate(subscription.endDate)}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted small">Days Remaining</div>
                      <div className={`fw-bold fs-5 ${daysRemaining !== null && daysRemaining <= 7 ? "text-danger" : "text-success"}`}>
                        {daysRemaining !== null ? `${daysRemaining} days` : "N/A"}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted small">Auto Renew</div>
                      <div className="fw-semibold">{subscription.autoRenew ? "Enabled" : "Disabled"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-0 p-4">
                  <h5 className="fw-bold mb-0">Plan Limits</h5>
                </div>
                <div className="card-body p-4">
                  <div className="mb-4">
                    <div className="text-muted small">Employee Limit</div>
                    <div className="fw-semibold">{subscription.employeeLimit ?? company?.employeeLimit ?? "Unlimited"}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-muted small">Storage Limit</div>
                    <div className="fw-semibold">{subscription.storageLimit ?? company?.storageLimit ?? "N/A"} GB</div>
                  </div>
                  <div>
                    <div className="text-muted small mb-2">Company Status</div>
                    <span className={`badge rounded-pill px-3 py-2 ${company?.isActive ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}>
                      {company?.status || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        <div className="alert alert-light border mt-4 small text-muted">
          <i className="bi bi-info-circle me-2"></i>
          To change your plan or renew your subscription, contact the MediFlow team.
        </div>

      </div>
    </div>
  );
};

export default Billing;
