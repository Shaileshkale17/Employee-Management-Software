import axios from "axios";

export const BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const getToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.token || "";
  } catch {
    return "";
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && localStorage.getItem("user")) {
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(err);
  }
);

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
