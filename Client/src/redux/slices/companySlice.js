import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../utils/api";

const initialState = {
  company: null,
  loading: false,
  error: null,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompany: (state, action) => {
      state.company = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCompany, setLoading, setError } = companySlice.actions;

export const fetchCompanyProfile = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await api.get("/company/profile");
    dispatch(setCompany(res.data.data));
    dispatch(setError(null));
  } catch (e) {
    dispatch(setError(e?.response?.data?.message || "Failed to load company"));
  } finally {
    dispatch(setLoading(false));
  }
};

export default companySlice.reducer;
