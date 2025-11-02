import axios from "axios";
const API_BASE = "http://localhost:8000";

export const analyzeFile = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${API_BASE}/analyze`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
