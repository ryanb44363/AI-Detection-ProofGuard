import axios from "axios";
// Prefer environment override, fallback to current host with port 8000
const API_BASE = (import.meta as any).env?.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

export const analyzeFile = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${API_BASE}/analyze`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: false,
  });
  return res.data;
};
