import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMeetings,
  fetchDashboard,
  fetchMeetingAnalytics,
  fetchMeetingByMeetingId,
  createMeeting,
  createInstantMeeting,
  getPersonalRoom,
  updateMeeting,
  cancelMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
  joinMeetingAsEmployee,
  getMeetingParticipants,
  admitParticipant,
  removeParticipant,
  inviteGuest,
  getMeetingInvitations,
  getMeetingAttendance,
  getMeetingMessages,
  sendMeetingMessage,
  getMeetingRecordings,
  getMeetingNotes,
  saveMeetingNotes,
} from "../../utils/meetingApi";

const initialState = {
  meetings: [],
  total: 0,
  page: 1,
  limit: 10,
  hasMore: false,
  counts: { upcoming: 0, live: 0 },
  loading: false,
  error: null,

  dashboard: null,
  dashboardLoading: false,

  analytics: null,
  analyticsLoading: false,

  personalRoom: null,
  personalRoomLoading: false,

  activeMeeting: null,
  activeMeetingLoading: false,

  participants: [],
  participantsLoading: false,

  invitations: [],
  attendance: null,

  messages: [],
  messagesLoading: false,
  messagesHasMore: false,

  recordings: [],
  notes: null,
  notesLoading: false,
};

const meetingSlice = createSlice({
  name: "meeting",
  initialState,
  reducers: {
    setMeetings: (state, action) => {
      state.meetings = action.payload.meetings;
      state.total = action.payload.total ?? state.total;
      state.page = action.payload.page ?? state.page;
      state.hasMore = action.payload.hasMore ?? false;
      state.counts = action.payload.counts ?? state.counts;
    },
    clearMeetings: (state) => {
      state.meetings = [];
      state.total = 0;
      state.hasMore = false;
    },
    upsertMeeting: (state, action) => {
      const incoming = action.payload;
      const idx = state.meetings.findIndex((m) => m._id === incoming._id);
      if (idx === -1) {
        state.meetings.unshift(incoming);
      } else {
        state.meetings[idx] = incoming;
      }
      if (state.dashboard) {
        state.dashboard.live = (state.dashboard.live || []).filter((m) => m._id !== incoming._id);
        state.dashboard.upcoming = state.dashboard.upcoming.filter((m) => m._id !== incoming._id);
        if (incoming.status === "live") state.dashboard.live.unshift(incoming);
        else if (incoming.status === "upcoming") state.dashboard.upcoming.unshift(incoming);
      }
    },
    removeMeeting: (state, action) => {
      const id = action.payload;
      state.meetings = state.meetings.filter((m) => m._id !== id);
      state.total = Math.max(0, state.total - 1);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setDashboard: (state, action) => {
      state.dashboard = action.payload;
    },
    setDashboardLoading: (state, action) => {
      state.dashboardLoading = action.payload;
    },
    setAnalytics: (state, action) => {
      state.analytics = action.payload;
    },
    setAnalyticsLoading: (state, action) => {
      state.analyticsLoading = action.payload;
    },
    setPersonalRoom: (state, action) => {
      state.personalRoom = action.payload;
    },
    setPersonalRoomLoading: (state, action) => {
      state.personalRoomLoading = action.payload;
    },
    setActiveMeeting: (state, action) => {
      state.activeMeeting = action.payload;
    },
    setActiveMeetingLoading: (state, action) => {
      state.activeMeetingLoading = action.payload;
    },
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    setParticipantsLoading: (state, action) => {
      state.participantsLoading = action.payload;
    },
    setInvitations: (state, action) => {
      state.invitations = action.payload;
    },
    setAttendance: (state, action) => {
      state.attendance = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload.messages;
      state.messagesHasMore = action.payload.hasMore ?? false;
    },
    appendMessages: (state, action) => {
      state.messages.push(...action.payload);
    },
    updateMessageReactions: (state, action) => {
      const { messageId, reactions } = action.payload;
      const msg = state.messages.find((m) => String(m._id) === String(messageId));
      if (msg) msg.reactions = reactions || [];
    },
    setMessagesLoading: (state, action) => {
      state.messagesLoading = action.payload;
    },
    setRecordings: (state, action) => {
      state.recordings = action.payload;
    },
    setNotes: (state, action) => {
      state.notes = action.payload;
    },
    setNotesLoading: (state, action) => {
      state.notesLoading = action.payload;
    },
  },
});

export const {
  setMeetings,
  clearMeetings,
  upsertMeeting,
  removeMeeting,
  setLoading,
  setError,
  setDashboard,
  setDashboardLoading,
  setAnalytics,
  setAnalyticsLoading,
  setPersonalRoom,
  setPersonalRoomLoading,
  setActiveMeeting,
  setActiveMeetingLoading,
  setParticipants,
  setParticipantsLoading,
  setInvitations,
  setAttendance,
  setMessages,
  appendMessages,
  updateMessageReactions,
  setMessagesLoading,
  setRecordings,
  setNotes,
  setNotesLoading,
} = meetingSlice.actions;

export const loadMeetings =
  ({ tab, status, type, search, page = 1, limit = 10 } = {}) =>
  async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchMeetings({ tab, status, type, search, page, limit });
      dispatch(
        setMeetings({
          meetings: data.data || [],
          total: data.total || 0,
          page: data.page || page,
          hasMore: data.hasMore || false,
          counts: data.counts || { upcoming: 0, live: 0 },
        })
      );
    } catch (err) {
      dispatch(setError(err?.response?.data?.message || "Failed to load meetings"));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const loadDashboard = () => async (dispatch) => {
  dispatch(setDashboardLoading(true));
  try {
    const data = await fetchDashboard();
    dispatch(setDashboard(data));
  } catch (err) {
    dispatch(setError(err?.response?.data?.message || "Failed to load meeting dashboard"));
  } finally {
    dispatch(setDashboardLoading(false));
  }
};

export const loadAnalytics = () => async (dispatch) => {
  dispatch(setAnalyticsLoading(true));
  try {
    const data = await fetchMeetingAnalytics();
    dispatch(setAnalytics(data));
  } catch {
    dispatch(setAnalytics(null));
  } finally {
    dispatch(setAnalyticsLoading(false));
  }
};

export const loadPersonalRoom = () => async (dispatch) => {
  dispatch(setPersonalRoomLoading(true));
  try {
    const data = await getPersonalRoom();
    dispatch(setPersonalRoom(data));
    return data;
  } catch (err) {
    dispatch(setError(err?.response?.data?.message || "Failed to load personal room"));
    return null;
  } finally {
    dispatch(setPersonalRoomLoading(false));
  }
};

export const loadActiveMeeting = (meetingId) => async (dispatch) => {
  dispatch(setActiveMeetingLoading(true));
  try {
    const data = await fetchMeetingByMeetingId(meetingId);
    dispatch(setActiveMeeting(data));
    return data;
  } catch (err) {
    dispatch(setError(err?.response?.data?.message || "Failed to load meeting"));
    return null;
  } finally {
    dispatch(setActiveMeetingLoading(false));
  }
};

export const createNewMeeting = (payload) => async (dispatch) => {
  const meeting =
    payload.type === "instant" ? await createInstantMeeting(payload) : await createMeeting(payload);
  dispatch(upsertMeeting(meeting));
  return meeting;
};

export const editMeeting = (id, payload) => async (dispatch) => {
  const meeting = await updateMeeting(id, payload);
  dispatch(upsertMeeting(meeting));
  return meeting;
};

export const cancelExistingMeeting = (id) => async (dispatch) => {
  const meeting = await cancelMeeting(id);
  dispatch(upsertMeeting(meeting));
  return meeting;
};

export const deleteExistingMeeting = (id) => async (dispatch) => {
  await deleteMeeting(id);
  dispatch(removeMeeting(id));
};

export const startExistingMeeting = (id) => async (dispatch) => {
  const meeting = await startMeeting(id);
  dispatch(upsertMeeting(meeting));
  return meeting;
};

export const endExistingMeeting = (id) => async (dispatch) => {
  const meeting = await endMeeting(id);
  dispatch(upsertMeeting(meeting));
  return meeting;
};

export const joinExistingMeeting = (meetingId) => async () => {
  const data = await joinMeetingAsEmployee(meetingId);
  return data;
};

export const loadParticipants = (meetingId) => async (dispatch) => {
  dispatch(setParticipantsLoading(true));
  try {
    const data = await getMeetingParticipants(meetingId);
    dispatch(setParticipants(data));
    return data;
  } catch (err) {
    dispatch(setError(err?.response?.data?.message || "Failed to load participants"));
    return [];
  } finally {
    dispatch(setParticipantsLoading(false));
  }
};

export const admitExistingParticipant = (meetingId, participantId) => async (dispatch) => {
  const data = await admitParticipant(meetingId, participantId);
  dispatch(setParticipants((await getMeetingParticipants(meetingId)) || []));
  return data;
};

export const kickParticipant = (meetingId, participantId) => async (dispatch) => {
  await removeParticipant(meetingId, participantId);
  const data = await getMeetingParticipants(meetingId);
  dispatch(setParticipants(data || []));
  return data;
};

export const inviteGuestToMeeting = (meetingId, payload) => async () => {
  const data = await inviteGuest(meetingId, payload);
  return data;
};

export const loadInvitations = (meetingId) => async (dispatch) => {
  const data = await getMeetingInvitations(meetingId);
  dispatch(setInvitations(data || []));
  return data;
};

export const loadAttendance = (meetingId) => async (dispatch) => {
  const data = await getMeetingAttendance(meetingId);
  dispatch(setAttendance(data));
  return data;
};

export const loadMessages = ({ meetingId, page = 1, limit = 50 } = {}) => async (dispatch) => {
  dispatch(setMessagesLoading(true));
  try {
    const data = await getMeetingMessages({ meetingId, page, limit });
    dispatch(setMessages({ messages: data.messages || data.data || [], hasMore: data.hasMore || false }));
  } catch (err) {
    dispatch(setError(err?.response?.data?.message || "Failed to load messages"));
  } finally {
    dispatch(setMessagesLoading(false));
  }
};

export const sendNewMessage = ({ meetingId, formData }) => async (dispatch) => {
  const data = await sendMeetingMessage({ meetingId, formData });
  dispatch(appendMessages([data]));
  return data;
};

export const loadRecordings = (meetingId) => async (dispatch) => {
  const data = await getMeetingRecordings(meetingId);
  dispatch(setRecordings(data || []));
  return data;
};

export const loadNotes = (meetingId) => async (dispatch) => {
  dispatch(setNotesLoading(true));
  try {
    const data = await getMeetingNotes(meetingId);
    dispatch(setNotes(data));
    return data;
  } catch {
    dispatch(setNotes(null));
    return null;
  } finally {
    dispatch(setNotesLoading(false));
  }
};

export const persistNotes = (meetingId, payload) => async (dispatch) => {
  const data = await saveMeetingNotes(meetingId, payload);
  dispatch(setNotes(data));
  return data;
};

export default meetingSlice.reducer;
