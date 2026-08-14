import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import companySlice from "./slices/companySlice";
import calendarSlice from "./slices/calendarSlice";
import meetingSlice from "./slices/meetingSlice";
import themeSlice from "./slices/themeSlice";

const store = configureStore({
  reducer: {
    auth: authSlice,
    company: companySlice,
    calendar: calendarSlice,
    meeting: meetingSlice,
    theme: themeSlice,
  },
});
export default store;
