const Contact = () => {
  // Backend has no `/api/contact` endpoint; keep a UI with contact details and a TODO.
  return (
    <div className="container my-5">
      <h1>Contact Us</h1>
      <p className="text-muted">For support or inquiries, please use the contact details below.</p>

      <div className="mt-4" style={{maxWidth:600}}>
        <p>
          <strong>Email:</strong> <a href="mailto:support@mediflow.com">support@mediflow.com</a>
        </p>
        <p>
          <strong>Phone:</strong> +91 98765 43210
        </p>
        <p className="text-warning">TODO: Implement `/api/contact` on the backend and wire this form to it.</p>
      </div>
    </div>
  )
}

export default Contact
