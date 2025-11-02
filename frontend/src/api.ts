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
  // New optional fields from enhanced analyzer
  mode?: string;
  format?: string;
  edge_density?: number;
  ela_mean?: number;
  color_unique_ratio?: number;
  exif_missing?: string[];
  laplacian_var?: number;
  flat_block_ratio?: number;
  jpeg_qtables_present?: boolean;
  blockiness_score?: number;
  chroma_luma_ratio?: number;
  brightness_mean?: number;
  brightness_std?: number;
  saturation_mean?: number;
  saturation_std?: number;
  gray_skewness?: number;
  dark_ratio?: number;
  bright_ratio?: number;
  aspect_ratio?: number;
  megapixels?: number;
  meta_field_count?: number;
  score_breakdown?: Record<string, number>;
  final_score?: number;
  text_features?: {
    ttr?: number;
    avg_sentence_len?: number;
    repetition_top5_share?: number;
    stopword_ratio?: number;
    digit_ratio?: number;
    punct_ratio?: number;
    word_count?: number;
    char_count?: number;
  };
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
