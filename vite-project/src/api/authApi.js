import axios from "./axiosInstance";

export async function loginApi({ email, password }) {
  const resp = await axios.post("/api/login", { email, password });
  return resp.data;
}

export async function sendInviteApi(payload) {
  const resp = await axios.post("/api/auth/invite/send", payload);
  return resp.data;
}

export async function acceptInviteApi(token, payload) {
  const resp = await axios.post(
    `/api/auth/invite/accept/${token}`,
    payload
  );

  return resp.data;
}

export async function forgotPasswordApi(email) {
  const resp = await axios.post("/api/auth/forgot-password", {
    email,
  });

  return resp.data;
}

export async function resetPasswordApi(token, password) {
  const resp = await axios.post(
    `/api/auth/reset-password/${token}`,
    { password }
  );

  return resp.data;
}

export async function changePasswordApi({
  currentPassword,
  newPassword,
}) {
  const resp = await axios.post("/api/auth/change-password", {
    currentPassword,
    newPassword,
  });

  return resp.data;
}

export default {
  loginApi,
  sendInviteApi,
  acceptInviteApi,
  forgotPasswordApi,
  resetPasswordApi,
  changePasswordApi,
};