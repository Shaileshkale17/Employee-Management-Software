import { createSlice } from "@reduxjs/toolkit";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const initialState = {
  user: readUser(),
  isLoginIn: !!localStorage.getItem("user"),
  pendingMfa: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isLoginIn = true;
      state.pendingMfa = false;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.isLoginIn = false;
      state.pendingMfa = false;
      localStorage.removeItem("user");
    },
    setPendingMfa: (state, action) => {
      state.pendingMfa = action.payload;
    },
  },
});

export const { login, logout, setPendingMfa } = authSlice.actions;
export default authSlice.reducer;
