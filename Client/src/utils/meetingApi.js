import { api } from "./api";

export const fetchMeetings = async ({ tab, status, type, search, page, limit }) => {
  const params = { tab, status, type, search, page, limit };
  const res = await api.get("/meeting/", { params });
  return res.data.data;
};

export const fetchDashboard = async () => {
  const res = await api.get("/meeting/dashboard");
  return res.data.data;
};

export const fetchMeetingAnalytics = async () => {
  const res = await api.get("/meeting/analytics");
  return res.data.data;
};

export const fetchMeetingByMeetingId = async (meetingId) => {
  const res = await api.get(`/meeting/meetingId/${meetingId}`);
  return res.data.data;
};

export const fetchMeetingById = async (id) => {
  const res = await api.get(`/meeting/${id}`);
  return res.data.data;
};

export const createMeeting = async (payload) => {
  const res = await api.post("/meeting/create", payload);
  return res.data.data;
};

export const createInstantMeeting = async (payload) => {
  const res = await api.post("/meeting/instant", payload);
  return res.data.data;
};

export const getPersonalRoom = async () => {
  const res = await api.get("/meeting/personal-room");
  return res.data.data;
};

export const updateMeeting = async (id, payload) => {
  const res = await api.put(`/meeting/update/${id}`, payload);
  return res.data.data;
};

export const cancelMeeting = async (id) => {
  const res = await api.patch(`/meeting/${id}/cancel`);
  return res.data.data;
};

export const deleteMeeting = async (id) => {
  const res = await api.delete(`/meeting/delete/${id}`);
  return res.data.data;
};

export const startMeeting = async (id) => {
  const res = await api.post(`/meeting/${id}/start`);
  return res.data.data;
};

export const endMeeting = async (id) => {
  const res = await api.post(`/meeting/${id}/end`);
  return res.data.data;
};

export const joinMeeting = async (meetingId, token) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const res = await api.post(`/meeting/public/join/${meetingId}`, {}, config);
  return res.data.data;
};

export const joinMeetingAsEmployee = async (meetingId) => {
  const res = await api.post(`/meeting/${meetingId}/join`);
  return res.data.data;
};

export const getMeetingParticipants = async (id) => {
  const res = await api.get(`/meeting/${id}/participants`);
  return res.data.data;
};

export const updateParticipant = async (meetingId, participantId, payload) => {
  const res = await api.patch(`/meeting/${meetingId}/participants/${participantId}`, payload);
  return res.data.data;
};

export const admitParticipant = async (meetingId, participantId) => {
  const res = await api.patch(`/meeting/${meetingId}/participants/${participantId}/admit`);
  return res.data.data;
};

export const removeParticipant = async (meetingId, participantId) => {
  const res = await api.delete(`/meeting/${meetingId}/participants/${participantId}`);
  return res.data.data;
};

export const inviteGuest = async (meetingId, payload) => {
  const res = await api.post(`/meeting/${meetingId}/invite`, payload);
  return res.data.data;
};

export const getMeetingInvitations = async (meetingId) => {
  const res = await api.get(`/meeting/${meetingId}/invitations`);
  return res.data.data;
};

export const getMeetingAttendance = async (meetingId) => {
  const res = await api.get(`/meeting/${meetingId}/attendance`);
  return res.data.data;
};

export const getMeetingChannel = async (meetingId) => {
  const res = await api.get(`/meeting/${meetingId}/channel`);
  return res.data.data;
};

export const getMeetingMessages = async ({ meetingId, page, limit }) => {
  const res = await api.get(`/meeting-message/${meetingId}`, { params: { page, limit } });
  return res.data.data;
};

export const sendMeetingMessage = async ({ meetingId, formData }) => {
  const res = await api.post(`/meeting-message/${meetingId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const reactToMessage = async (messageId, emoji) => {
  const res = await api.post(`/meeting-message/react/${messageId}`, { emoji });
  return res.data.data;
};

export const deleteMeetingMessage = async (messageId) => {
  const res = await api.delete(`/meeting-message/${messageId}`);
  return res.data.data;
};

export const getMeetingRecordings = async (meetingId) => {
  const res = await api.get(`/recording/${meetingId}`);
  return res.data.data;
};

export const saveMeetingNotes = async (meetingId, payload) => {
  const res = await api.post(`/recording/notes/${meetingId}`, payload);
  return res.data.data;
};

export const getMeetingNotes = async (meetingId) => {
  const res = await api.get(`/recording/notes/${meetingId}`);
  return res.data.data;
};

// ---- Public guest flow ----
export const getPublicInvitation = async (token) => {
  const res = await api.get(`/meeting/public/invite/${token}`);
  return res.data.data;
};

export const verifyGuestOtp = async ({ token, email, otp }) => {
  const res = await api.post("/meeting/public/verify", { token, email, otp });
  return res.data.data;
};

export const resendGuestOtp = async (token) => {
  const res = await api.post("/meeting/public/resend-otp", { token });
  return res.data.data;
};
