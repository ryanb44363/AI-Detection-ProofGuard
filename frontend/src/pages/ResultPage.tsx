import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, File, FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface AnalysisResult {
  score: number;
  verdict: string;
  reason: string;
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
              <Upload className="w-16 h-16 text-gray-400" />
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
    </div>
  );
}
