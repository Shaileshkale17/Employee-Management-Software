import { api } from "./api";
import { toAPIDate } from "./dateUtils";

export const CALENDAR_PAGE_SIZE = 200;

export const fetchCalendarEvents = async ({ from, to, search, type, category, priority, status, page = 1 }) => {
  const params = {
    from: toAPIDate(from),
    to: toAPIDate(to),
    search: search || undefined,
    type: type || undefined,
    category: category || undefined,
    priority: priority || undefined,
    status: status || undefined,
    page,
    limit: CALENDAR_PAGE_SIZE,
  };
  const res = await api.get("/calendar/events", { params });
  return res.data.data;
};

export const fetchCalendarEvent = async (id) => {
  const res = await api.get(`/calendar/${id}`);
  return res.data.data;
};

export const createCalendarEvent = async (payload) => {
  const res = await api.post("/calendar/create", payload);
  return res.data.data;
};

export const updateCalendarEvent = async (id, payload, occurrenceStart) => {
  const res = await api.put(`/calendar/update/${id}`, payload, {
    params: occurrenceStart ? { occurrence: toAPIDate(occurrenceStart) } : undefined,
  });
  return res.data.data;
};

export const deleteCalendarEvent = async (id, occurrenceStart) => {
  const res = await api.delete(`/calendar/delete/${id}`, {
    params: occurrenceStart ? { occurrence: toAPIDate(occurrenceStart) } : undefined,
  });
  return res.data.data;
};

export const updateEventStatus = async (id, status) => {
  const res = await api.patch(`/calendar/${id}/status`, { status });
  return res.data.data;
};

export const duplicateCalendarEvent = async (id) => {
  const res = await api.post(`/calendar/${id}/duplicate`);
  return res.data.data;
};

export const snoozeCalendarEvent = async (id, minutes) => {
  const res = await api.post(`/calendar/${id}/snooze`, { minutes });
  return res.data.data;
};

export const uploadEventAttachments = async (id, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("attachments", file));
  const res = await api.post(`/calendar/${id}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const fetchUpcomingPanel = async () => {
  const res = await api.get("/calendar/upcoming-panel");
  return res.data.data;
};

export const fetchCalendarOverview = async () => {
  const res = await api.get("/calendar/overview");
  return res.data.data;
};

export const fetchMyEvents = async () => {
  const res = await api.get("/calendar/my-events");
  return res.data.data;
};

export const fetchInterviewEvents = async () => {
  const res = await api.get("/calendar/interview-events");
  return res.data.data;
};
