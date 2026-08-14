import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCalendarEvents,
  fetchCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateEventStatus,
  duplicateCalendarEvent,
  snoozeCalendarEvent,
  uploadEventAttachments,
  fetchUpcomingPanel,
  fetchCalendarOverview,
} from "../../utils/calendarApi";

const initialState = {
  events: [],
  total: 0,
  page: 1,
  loading: false,
  panelLoading: false,
  overviewLoading: false,
  upcomingPanel: [],
  overview: null,
  error: null,
};

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload.events;
      state.total = action.payload.total ?? state.total;
      state.page = action.payload.page ?? 1;
    },
    clearEvents: (state) => {
      state.events = [];
      state.total = 0;
    },
    upsertEvent: (state, action) => {
      const incoming = action.payload;
      const idx = state.events.findIndex((e) => e._id === incoming._id);
      if (idx === -1) {
        state.events.push(incoming);
      } else {
        state.events[idx] = incoming;
      }
      state.events.sort((a, b) => new Date(a.start) - new Date(b.start));
    },
    removeEvent: (state, action) => {
      const id = action.payload;
      state.events = state.events.filter((e) => e._id !== id);
      state.total = Math.max(0, state.total - 1);
    },
    setPanel: (state, action) => {
      state.upcomingPanel = action.payload;
    },
    setOverview: (state, action) => {
      state.overview = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPanelLoading: (state, action) => {
      state.panelLoading = action.payload;
    },
    setOverviewLoading: (state, action) => {
      state.overviewLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setEvents,
  clearEvents,
  upsertEvent,
  removeEvent,
  setPanel,
  setOverview,
  setLoading,
  setPanelLoading,
  setOverviewLoading,
  setError,
} = calendarSlice.actions;

export const loadEvents =
  ({ from, to, search, type, category, priority, status, page = 1 }) =>
  async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchCalendarEvents({ from, to, search, type, category, priority, status, page });
      dispatch(
        setEvents({
          events: data.events || [],
          total: data.total || 0,
          page: data.page || page,
        })
      );
    } catch (err) {
      dispatch(setError(err?.response?.data?.message || "Failed to load calendar events"));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const getEvent = (id) => async () => fetchCalendarEvent(id);

export const createEvent = (payload) => async (dispatch) => {
  const event = await createCalendarEvent(payload);
  dispatch(upsertEvent(event));
  return event;
};

export const updateEvent = (id, payload, occurrenceStart) => async (dispatch) => {
  const event = await updateCalendarEvent(id, payload, occurrenceStart);
  dispatch(upsertEvent(event));
  return event;
};

export const deleteEvent = (id, occurrenceStart) => async (dispatch) => {
  await deleteCalendarEvent(id, occurrenceStart);
  dispatch(removeEvent(id));
};

export const changeEventStatus = (id, status) => async (dispatch) => {
  const event = await updateEventStatus(id, status);
  dispatch(upsertEvent(event));
  return event;
};

export const duplicateEvent = (id) => async (dispatch) => {
  const event = await duplicateCalendarEvent(id);
  dispatch(upsertEvent(event));
  return event;
};

export const snoozeEvent = (id, minutes) => async (dispatch) => {
  const event = await snoozeCalendarEvent(id, minutes);
  dispatch(upsertEvent(event));
  return event;
};

export const addAttachments = (id, files) => async (dispatch) => {
  const event = await uploadEventAttachments(id, files);
  dispatch(upsertEvent(event));
  return event;
};

export const loadUpcomingPanel = () => async (dispatch) => {
  dispatch(setPanelLoading(true));
  try {
    const data = await fetchUpcomingPanel();
    dispatch(setPanel(data));
  } catch (err) {
    dispatch(setError(err?.response?.data?.message || "Failed to load upcoming events"));
  } finally {
    dispatch(setPanelLoading(false));
  }
};

export const loadOverview = () => async (dispatch) => {
  dispatch(setOverviewLoading(true));
  try {
    const data = await fetchCalendarOverview();
    dispatch(setOverview(data));
  } catch {
    dispatch(setOverview(null));
  } finally {
    dispatch(setOverviewLoading(false));
  }
};

export default calendarSlice.reducer;
