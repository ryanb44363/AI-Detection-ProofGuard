import axios from "axios";
// Prefer environment override, fallback to current host with port 8000
const { VITE_API_URL } = import.meta.env as { VITE_API_URL?: string };
const API_BASE = VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:8000`;

export interface AnalyzerDetails {
  meta_hits?: string[];
  ocr_hits?: string[];
  entropy?: number;
  width?: number;
  height?: number;
  ocr_preview?: string;
  ocr_full?: string;
  meta?: Record<string, unknown>;
}

export interface AnalysisResult {
  score: number;
  verdict: "authentic" | "synthetic" | string;
  reason: string;
  details?: AnalyzerDetails;
}

export const analyzeFile = async (file: File): Promise<AnalysisResult> => {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${API_BASE}/analyze`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: false,
  });
  return res.data as AnalysisResult;
};
