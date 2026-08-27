import { useEffect, useState } from "react";
import notificationApi from "../../api/notificationApi";
import userApi from "../../api/userApi";

const SendMessage = () => {
  const [channel, setChannel] = useState("notification");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => { userApi.listUsers().then(({ users }) => setUsers(users || [])).catch(() => setStatus({ error: "Unable to load company recipients", success: "" })); }, []);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const send = async (event) => {
    event.preventDefault(); setStatus({ error: "", success: "" }); setSending(true);
    try {
      const data = new FormData(); data.append("channel", channel); data.append("subject", subject); data.append("body", body);
      // Notifications are deliberately company-wide. Selected recipients apply to email only.
      if (channel === "email" && selected.length) data.append("recipientIds", JSON.stringify(selected));
      if (attachment && channel === "email") data.append("attachment", attachment);
      const result = await notificationApi.sendCompanyMessage(data);
      setStatus({ success: result.message, error: "" }); setSubject(""); setBody(""); setAttachment(null); setSelected([]);
    } catch (error) { setStatus({ error: error.response?.data?.message || "Unable to send message", success: "" }); }
    finally { setSending(false); }
  };
  return <div className="container-fluid py-3"><div className="card border-0 shadow-sm rounded-4 overflow-hidden">
    <div className="card-body p-4 p-lg-5 text-white" style={{ background: "linear-gradient(135deg,var(--mf-color-primary),var(--mf-color-accent))" }}><h2 className="fw-bold mb-1">Send Company Message</h2><p className="mb-0 opacity-75">Reach employees in your company by email or in-app notification.</p></div>
    <form className="card-body p-4" onSubmit={send}>
      {status.error && <div className="alert alert-danger">{status.error}</div>}{status.success && <div className="alert alert-success">{status.success}</div>}
      <div className="mb-4"><label className="form-label fw-semibold">Send as</label><div className="d-flex gap-3"><label><input className="form-check-input me-2" type="radio" checked={channel === "notification"} onChange={() => setChannel("notification")} />Notification</label><label><input className="form-check-input me-2" type="radio" checked={channel === "email"} onChange={() => setChannel("email")} />Email</label></div></div>
      {channel === "notification" ? <div className="alert alert-info mb-3"><i className="bi bi-people me-2"></i>This notification will be sent to all active employees in your company.</div> : <div className="mb-3"><label className="form-label fw-semibold">Email recipients</label><div className="d-flex justify-content-between mb-2"><small className="text-muted">Leave everyone unchecked to email all active employees in your company.</small><button type="button" className="btn btn-link btn-sm p-0" onClick={() => setSelected(selected.length === users.length ? [] : users.map((u) => u._id))}>{selected.length === users.length ? "Clear all" : "Select all"}</button></div><div className="border rounded-3 p-2" style={{ maxHeight: 210, overflowY: "auto" }}>{users.map((user) => <label className="d-flex align-items-center gap-2 p-2 border-bottom" key={user._id}><input className="form-check-input" type="checkbox" checked={selected.includes(user._id)} onChange={() => toggle(user._id)} /><span>{user.name} <small className="text-muted">({user.email || "no email"})</small></span></label>)}</div></div>}
      <div className="mb-3"><label className="form-label fw-semibold">Subject</label><input className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength="150" /></div>
      <div className="mb-3"><label className="form-label fw-semibold">Message</label><textarea className="form-control" rows="6" value={body} onChange={(e) => setBody(e.target.value)} required maxLength="5000" /></div>
      {channel === "email" && <div className="mb-4"><label className="form-label fw-semibold">Attachment <span className="text-muted fw-normal">(optional, max 5 MB)</span></label><input className="form-control" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} /></div>}
      <button className="btn btn-primary px-4" disabled={sending}>{sending ? "Sending…" : `Send ${channel === "email" ? "Email" : "Notification"}`}</button>
    </form></div></div>;
};
export default SendMessage;
