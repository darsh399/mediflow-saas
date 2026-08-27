import { useState } from "react";
import demoRequestApi from "../api/demoRequestApi";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await demoRequestApi.createDemoRequest(formData);

      setSubmitted(true);

      setFormData({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          "Unable to submit your enquiry right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <section
        className="py-5 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <span className="badge bg-white text-primary rounded-pill px-3 py-2 mb-3">
                Get in Touch
              </span>

              <h1 className="display-4 fw-bold mb-3">
                Contact MediFlow
              </h1>

              <p className="lead text-white opacity-75 mb-4">
                Interested in MediFlow for your organization? Send us
                an enquiry and our team will get in touch with you.
              </p>

              <button
                type="button"
                className="btn btn-light btn-lg rounded-pill px-4 fw-semibold text-primary d-inline-flex align-items-center gap-2"
                onClick={() => {
                  setVideoUnavailable(false);
                  setShowDemo(true);
                }}
              >
                <span
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px" }}
                >
                  <i className="bi bi-play-fill"></i>
                </span>
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {showDemo && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowDemo(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            role="document"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 overflow-hidden">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-play-circle text-primary me-2"></i>
                  MediFlow Product Demo
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowDemo(false)}
                />
              </div>
              <div className="modal-body pt-2">
                {videoUnavailable ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-camera-video-off fs-1 d-block mb-3"></i>
                    Our demo video isn&apos;t available right now.
                    <br />
                    Please send us an enquiry below and we&apos;ll walk you
                    through MediFlow directly.
                  </div>
                ) : (
                  <video
                    className="w-100 rounded-3"
                    controls
                    autoPlay
                    src="/demo-video.mp4"
                    onError={() => setVideoUnavailable(true)}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="py-5">
        <div className="container">
          <div className="row g-4 justify-content-center">
            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body p-4 text-center">
                  <div
                    className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                    style={{
                      width: "65px",
                      height: "65px",
                    }}
                  >
                    <i
                      className="bi bi-envelope"
                      style={{ fontSize: "28px" }}
                    ></i>
                  </div>

                  <h5 className="fw-bold">Email Support</h5>

                  <p className="text-muted mb-3">
                    Send us your questions and requirements.
                  </p>

                  <a
                    href="mailto:support@mediflow.com"
                    className="text-decoration-none fw-semibold"
                  >
                    support@mediflow.com
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body p-4 text-center">
                  <div
                    className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                    style={{
                      width: "65px",
                      height: "65px",
                    }}
                  >
                    <i
                      className="bi bi-telephone"
                      style={{ fontSize: "28px" }}
                    ></i>
                  </div>

                  <h5 className="fw-bold">Phone Support</h5>

                  <p className="text-muted mb-3">
                    Speak directly with our support team.
                  </p>

                  <a
                    href="tel:+919876543210"
                    className="text-decoration-none fw-semibold"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body p-4 text-center">
                  <div
                    className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                    style={{
                      width: "65px",
                      height: "65px",
                    }}
                  >
                    <i
                      className="bi bi-clock"
                      style={{ fontSize: "28px" }}
                    ></i>
                  </div>

                  <h5 className="fw-bold">Support Hours</h5>

                  <p className="text-muted mb-2">
                    Monday - Friday
                  </p>

                  <span className="fw-semibold">
                    9:00 AM - 6:00 PM
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="row justify-content-center mt-5">
            <div className="col-xl-9">
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="row g-0">
                  <div
                    className="col-lg-5 p-4 p-md-5 text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--mf-color-primary), var(--mf-color-accent))",
                    }}
                  >
                    <span className="badge bg-white text-primary rounded-pill px-3 py-2 mb-3">
                      Business Enquiry
                    </span>

                    <h2 className="fw-bold mb-3">
                      Let's talk about your business
                    </h2>

                    <p className="text-white opacity-75">
                      Tell us about your organization and what you
                      need. Our team will contact you to discuss how
                      MediFlow can help.
                    </p>

                    <div className="mt-4">
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-check-circle-fill me-3"></i>
                        <span>Easy business management</span>
                      </div>

                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-check-circle-fill me-3"></i>
                        <span>Secure employee management</span>
                      </div>

                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-check-circle-fill me-3"></i>
                        <span>Company-wise data isolation</span>
                      </div>

                      <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill me-3"></i>
                        <span>Scalable SaaS platform</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-7 bg-white p-4 p-md-5">
                    <div className="mb-4">
                      <h3 className="fw-bold mb-2">
                        Send an Enquiry
                      </h3>

                      <p className="text-muted mb-0">
                        Fill in your details and we'll get back to you.
                      </p>
                    </div>

                    {submitted && (
                      <div className="alert alert-success rounded-3">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Thank you for your enquiry. Our team will
                        contact you soon.
                      </div>
                    )}

                    {error && (
                      <div className="alert alert-danger rounded-3">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Your Name
                          </label>

                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Company Name
                          </label>

                          <input
                            type="text"
                            name="companyName"
                            className="form-control"
                            placeholder="Enter company name"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Email Address
                          </label>

                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="you@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Phone Number
                          </label>

                          <input
                            type="tel"
                            name="phone"
                            className="form-control"
                            placeholder="+91 XXXXX XXXXX"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Subject
                        </label>

                        <select
                          name="subject"
                          className="form-select"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        >
                          <option value="">
                            Select an enquiry type
                          </option>
                          <option value="product-demo">
                            Request Product Demo
                          </option>
                          <option value="pricing">
                            Pricing & Subscription
                          </option>
                          <option value="business">
                            Business Enquiry
                          </option>
                          <option value="support">
                            Product Support
                          </option>
                          <option value="other">
                            Other
                          </option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-semibold">
                          Message
                        </label>

                        <textarea
                          name="message"
                          className="form-control"
                          rows="5"
                          placeholder="Tell us about your requirements..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 rounded-3"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Send Enquiry
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-5">
            <p className="text-muted mb-0">
              We look forward to helping your business grow with
              MediFlow.
            </p>
          </div>
        </div>
      </section>

      <style>
        {`
          .card {
            transition: all 0.3s ease;
          }

          .card:hover {
            transform: translateY(-5px);
          }

          .form-control,
          .form-select {
            border-radius: 10px;
            padding: 12px 14px;
            border-color: #dee2e6;
          }

          .form-control:focus,
          .form-select:focus {
            border-color: var(--mf-color-primary);
            box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.1);
          }

          @media (max-width: 768px) {
            .display-4 {
              font-size: 2.3rem;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Contact;