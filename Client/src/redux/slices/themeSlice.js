import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* ignore */
  }
  return "dark";
};

const applyTheme = (mode) => {
  document.documentElement.classList.toggle("dark", mode === "dark");
};

const initialMode = getInitialTheme();
applyTheme(initialMode);

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: initialMode },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", state.mode);
      } catch {
        /* ignore */
      }
      applyTheme(state.mode);
    },
    setTheme(state, action) {
      state.mode = action.payload === "dark" ? "dark" : "light";
      try {
        localStorage.setItem("theme", state.mode);
      } catch {
        /* ignore */
      }
      applyTheme(state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
