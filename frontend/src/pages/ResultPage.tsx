import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, File, FileText, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AnalyzerDetails } from "../api";
import Header from "../components/Header";

interface AnalysisResult {
  score: number;
  verdict: string;
  reason: string;
  details?: AnalyzerDetails;
  individual_predictions?: Record<string, {
    verdict: string;
    score: number;
    confidence: number;
    reason: string;
  }>;
  vote_summary?: {
    total_models: number;
    synthetic_votes: number;
    authentic_votes: number;
  };
  models_used?: string[];
}

interface LocationState {
  fileName?: string;
  previewUrl?: string | null;
  isImage?: boolean;
  result?: AnalysisResult;
}

function Gauge({ value, verdict }: { value: number; verdict: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color = verdict === 'authentic' ? '#10b981' : '#f59e0b';
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative">
        <svg viewBox="0 0 200 120" className="w-full">
          <path d="M10 110 A90 90 0 0 1 190 110" fill="none" stroke="#e5e7eb" strokeWidth="16" pathLength={100} />
          <path d="M10 110 A90 90 0 0 1 190 110" fill="none" stroke={color} strokeLinecap="round" strokeWidth="16" pathLength={100} strokeDasharray={`${pct} 100`} />
          {Array.from({ length: 11 }).map((_, i) => {
            const angle = Math.PI * (1 - i / 10);
            const rOuter = 100; const rInner = 90;
            const cx = 100, cy = 110;
            const x1 = cx + rInner * Math.cos(angle);
            const y1 = cy - rInner * Math.sin(angle);
            const x2 = cx + rOuter * Math.cos(angle);
            const y2 = cy - rOuter * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f3f4f6" strokeWidth={2} />
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center -mt-4">
          <div className="text-center">
            <div className="text-4xl font-extrabold" style={{ color }}>{pct}%</div>
            <div className="text-xs text-gray-500 mt-1">Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}


function ModelResultsSection({ result }: { result: AnalysisResult }) {
  const { individual_predictions, vote_summary, models_used } = result;

  if (!individual_predictions || Object.keys(individual_predictions).length === 0) {
    return null;
  }

  const getModelIcon = (modelName: string): string => {
    if (modelName.includes('DetectGPT')) return '🔍';
    if (modelName.includes('RoBERTa') || modelName.includes('BERT')) return '🧠';
    if (modelName.includes('GLTR')) return '📊';
    if (modelName.includes('Stylometry')) return '✍️';
    if (modelName.includes('LLM') || modelName.includes('Ensemble')) return '🎯';
    if (modelName.includes('DetectLLM')) return '🔎';
    if (modelName.includes('EST') || modelName.includes('Entropy')) return '📈';
    if (modelName.includes('EfficientNet')) return '🖼️';
    if (modelName.includes('CLIP')) return '👀';
    if (modelName.includes('NoisePrint') || modelName.includes('PRNU')) return '🔊';
    if (modelName.includes('JPEG')) return '📷';
    if (modelName.includes('C2PA')) return '🛡️';
    if (modelName.includes('DRF') || modelName.includes('Deepfake')) return '🎭';
    if (modelName.includes('Spectral') || modelName.includes('GAN')) return '🌈';
    if (modelName.includes('Metadata')) return '📋';
    return '🔬';
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        🤖 AI Detection Models
      </h2>
      
      {/* Consensus Analysis */}
      {vote_summary && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="font-semibold text-gray-900 mb-2">Consensus Analysis</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">📊 {vote_summary.total_models}</div>
              <div className="text-gray-600">models</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">🔴 {vote_summary.synthetic_votes}</div>
              <div className="text-gray-600">synthetic</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">🟢 {vote_summary.authentic_votes}</div>
              <div className="text-gray-600">authentic</div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Model Results */}
      <div className="space-y-3">
        {Object.entries(individual_predictions).map(([modelName, pred]) => {
          const scorePct = Math.round(pred.score * 100);
          const confPct = Math.round(pred.confidence * 100);
          const statusColor = pred.verdict === 'synthetic' ? 'text-orange-600' : pred.verdict === 'authentic' ? 'text-green-600' : 'text-gray-600';
          const bgColor = pred.verdict === 'synthetic' ? 'bg-orange-50' : pred.verdict === 'authentic' ? 'bg-green-50' : 'bg-gray-50';
          const borderColor = pred.verdict === 'synthetic' ? 'border-orange-200' : pred.verdict === 'authentic' ? 'border-green-200' : 'border-gray-200';
          const barColor = pred.verdict === 'synthetic' ? 'bg-orange-500' : pred.verdict === 'authentic' ? 'bg-green-500' : 'bg-gray-500';

          return (
            <div key={modelName} className={`border rounded-lg p-4 ${bgColor} ${borderColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <span>{getModelIcon(modelName)}</span>
                  <span className="text-sm">{modelName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-bold uppercase ${statusColor}`}>{pred.verdict}</span>
                  <span className="text-gray-600">{scorePct}%</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-300`}
                    style={{ width: `${scorePct}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 min-w-fit">Conf: {confPct}%</span>
              </div>
              
              {/* Reason */}
              {pred.reason && pred.reason !== modelName && (
                <div className="text-xs text-gray-700 mt-2">
                  {pred.reason.length > 120 ? `${pred.reason.substring(0, 120)}...` : pred.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="text-xs text-blue-800 flex items-center gap-2">
          <span>💡</span>
          <span>
            <strong>Enhanced Analysis:</strong> Results from {models_used?.length || Object.keys(individual_predictions).length} specialized AI detection models covering text analysis, image forensics, and pattern recognition.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state || {}) as LocationState;
  const [local, setLocal] = useState<LocationState>({});

  useEffect(() => {
    if (!state.result) {
      const id = searchParams.get("id");
      if (id) {
        const key = `result:${id}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as LocationState;
            setLocal(parsed);
          } catch {
            // ignore parse errors
          } finally {
            // clean up stored payload
            localStorage.removeItem(key);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fileName = state.fileName ?? local.fileName;
  const previewUrl = state.previewUrl ?? local.previewUrl;
  const isImage = state.isImage ?? local.isImage;
  const result = state.result ?? local.result;

  const fileIcon = useMemo(() => {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (["png","jpg","jpeg","gif","bmp","webp","svg"].includes(ext || '')) return <ImageIcon className="w-4 h-4" />;
    if (ext === 'pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  }, [fileName]);

  // Larger, centered icon for when preview is unavailable
  const bigFileIcon = useMemo(() => {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (["png","jpg","jpeg","gif","bmp","webp","svg"].includes(ext || '')) return <ImageIcon className="w-16 h-16 text-gray-400" />;
    if (ext === 'pdf') return <FileText className="w-16 h-16 text-gray-400" />;
    return <File className="w-16 h-16 text-gray-400" />;
  }, [fileName]);

  if (!result) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-2">No result to display</h2>
        <p className="text-gray-600 mb-6">Upload a file to see the analysis results.</p>
        <button onClick={() => navigate('/')} className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow">
          Go to Uploads
        </button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="w-full px-4 md:px-6 py-8 md:py-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Preview */}
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200">
          {isImage && previewUrl ? (
            <div className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-gray-200">
              <img src={previewUrl} alt={fileName} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => navigate('/')}
                className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow"
                aria-label="Back to upload"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                {bigFileIcon}
              </div>
            )}
          {fileName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 truncate">
              {fileIcon}
              <span className="truncate" title={fileName}>{fileName}</span>
            </div>
          )}
        </div>

        {/* Right: Verdict */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className={`p-5 md:p-6 rounded-xl border ${result.verdict === 'authentic' ? 'bg-green-50/70 border-green-200' : 'bg-orange-50/70 border-orange-200'}`}>
            <div className="flex flex-col items-center gap-6">
              <Gauge value={result.score} verdict={result.verdict} />
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  {result.verdict === 'authentic' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  )}
                  <h3 className={`text-xl font-extrabold tracking-tight ${result.verdict === 'authentic' ? 'text-green-900' : 'text-orange-900'}`}>
                    {result.verdict === 'authentic' ? 'Authentic Content' : 'Potentially AI-Generated'}
                  </h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{result.reason}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => navigate('/')} className="w-full py-3 px-6 bg-white text-gray-800 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50">Back</button>
            <button onClick={() => navigate('/')} className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow">Analyze Another File</button>
          </div>
        </div>
      </div>

      {/* Comprehensive Analysis Breakdown */}
      <div className="max-w-5xl mx-auto mt-8 space-y-6">
        <SignalsSection details={result.details} finalScore={result.details?.final_score ?? result.score} />
        <DetectedTextSection details={result.details} />
        {/* Keep model results if backend provides them */}
        <ModelResultsSection result={result as any} />
      </div>
    </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div>{label}</div>
      <strong>{value}</strong>
    </>
  );
}

function SignalsSection({ details, finalScore }: { details?: AnalyzerDetails; finalScore: number }) {
  const d = details || {};
  const breakdown = d.score_breakdown || {};
  const rows: Array<[string, string]> = [];
  if (Object.keys(breakdown).length > 0) {
    for (const [k, v] of Object.entries(breakdown)) {
      const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      rows.push([label, `${Math.round(v * 100)}%`]);
    }
  } else {
    // fallback similar to standalone page
    rows.push(["Base score", "45%"]);
    rows.push(["Metadata indicators", (d.meta_hits?.length ? 35 : 0) + "%"]);
    rows.push(["OCR AI terms", (d.ocr_hits?.length ? 25 : 0) + "%"]);
    rows.push(["Low-entropy bump", typeof d.entropy === "number" && d.entropy < 5.5 ? "5%" : "0%"]);
  }

  const indicators: ReactNode = (
    <div>
      <div className="font-semibold mb-2">Indicators detected</div>
      {d.meta_hits?.length ? (
        <div className="text-sm"><strong>Metadata hits:</strong> {d.meta_hits.map((h, i) => <code key={i} className="mr-1">{h}</code>)}</div>
      ) : (
        <div className="text-sm">No explicit AI metadata markers found.</div>
      )}
      {d.ocr_hits?.length ? (
        <div className="text-sm mt-2"><strong>OCR hits:</strong> {d.ocr_hits.map((h, i) => <code key={i} className="mr-1">{h}</code>)}</div>
      ) : (
        <div className="text-sm mt-2">No AI keywords found in detected text.</div>
      )}
    </div>
  );

  const metrics: ReactNode[] = [];
  const push = (label: string, val?: number | string | boolean, fmt?: (v: any) => string) => {
    if (val === undefined || val === null || val === "") return;
    const value = typeof val === "number" ? (fmt ? fmt(val) : String(val)) : typeof val === "boolean" ? (val ? "yes" : "no") : String(val);
    metrics.push(<div key={label} className="text-sm">{label}: <strong>{value}</strong></div>);
  };
  push("Entropy", d.entropy, (v) => v.toFixed(2));
  push("Dimensions", d.width && d.height ? `${d.width}×${d.height}` : undefined);
  push("Metadata fields", d.meta_field_count);
  push("Detected words", d.ocr_full ? d.ocr_full.split(/\s+/).filter(Boolean).length : undefined);
  push("Edge density", d.edge_density, (v) => v.toFixed(3));
  push("ELA mean", d.ela_mean, (v) => v.toFixed(2));
  push("Unique color ratio", d.color_unique_ratio, (v) => `${(v * 100).toFixed(2)}%`);
  if (d.exif_missing && d.exif_missing.length) push("Missing EXIF", d.exif_missing.join(", "));
  push("Laplacian variance", d.laplacian_var, (v) => v.toFixed(2));
  push("Flat-block ratio", d.flat_block_ratio, (v) => `${(v * 100).toFixed(1)}%`);
  push("JPEG quantization tables present", d.jpeg_qtables_present);
  push("Blockiness score", d.blockiness_score, (v) => v.toFixed(3));
  push("Chroma/Luma ratio", d.chroma_luma_ratio, (v) => v.toFixed(3));
  push("Brightness mean/std", d.brightness_mean !== undefined ? `${(d.brightness_mean ?? 0).toFixed(1)} / ${(d.brightness_std ?? 0).toFixed(1)}` : undefined);
  push("Saturation mean/std", d.saturation_mean !== undefined ? `${(d.saturation_mean ?? 0).toFixed(3)} / ${(d.saturation_std ?? 0).toFixed(3)}` : undefined);
  push("Gray skewness", d.gray_skewness, (v) => v.toFixed(3));
  push("Dark/Bright pixel ratio", d.dark_ratio !== undefined && d.bright_ratio !== undefined ? `${(d.dark_ratio * 100).toFixed(1)}% / ${(d.bright_ratio * 100).toFixed(1)}%` : undefined);
  push("Aspect ratio", d.aspect_ratio, (v) => v.toFixed(3));
  push("Megapixels", d.megapixels, (v) => Number(v).toFixed(2));

  // Optional text metrics for PDF/TXT
  if (d.text_features) {
    const t = d.text_features;
    metrics.push(
      <div key="text-metrics" className="text-sm mt-2">
        <strong>Text metrics:</strong>{" "}
        <span className="text-gray-600">
          TTR {(t.ttr ?? 0).toFixed(2)}, Avg sentence len {(t.avg_sentence_len ?? 0).toFixed(1)}, Top5 repetition {t.repetition_top5_share ? (t.repetition_top5_share * 100).toFixed(1) : "0.0"}% , Stopword ratio {t.stopword_ratio ? (t.stopword_ratio * 100).toFixed(1) : "0.0"}% , Digits {t.digit_ratio ? (t.digit_ratio * 100).toFixed(1) : "0.0"}% , Punctuation {t.punct_ratio ? (t.punct_ratio * 100).toFixed(1) : "0.0"}%
        </span>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-extrabold text-gray-900 mb-3">Rating breakdown</h2>
      <div className="text-[14px] text-gray-700">
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
          {rows.map(([label, value]) => <Row key={label} label={label} value={value} />)}
        </div>
        <div className="mt-2 text-sm"><strong>Final score:</strong> {Math.round((finalScore ?? 0) * 100)}%</div>
        <hr className="my-3 border-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indicators}
          <div>
            <div className="font-semibold mb-2">Signal metrics</div>
            <div className="space-y-1">
              {metrics}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">This is a heuristic breakdown; not definitive proof.</p>
      </div>
    </section>
  );
}

function DetectedTextSection({ details }: { details?: AnalyzerDetails }) {
  const d = details || {};
  const text = d.ocr_full || d.ocr_preview || "";
  if (!text) return null;
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-extrabold text-gray-900 mb-3">Detected text (transcription)</h2>
      <div className="max-h-64 overflow-auto p-3 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-wrap text-sm text-gray-800">
        {text}
      </div>
    </section>
  );
}
