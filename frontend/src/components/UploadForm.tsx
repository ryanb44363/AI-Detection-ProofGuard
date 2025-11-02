import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, File, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { analyzeFile } from "../api";

interface AnalysisResult {
  score: number;
  verdict: string;
  reason: string;
}

export default function UploadForm() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setFileName(file.name);
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await analyzeFile(file);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to analyze file. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    maxSize: 10485760 // 10MB
  });

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
      return <Image className="w-5 h-5" />;
    } else if (ext === 'pdf') {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-3">
          Verify Content Authenticity
        </h2>
        <p className="text-lg text-white/80">
          Upload any document, image, or PDF to detect AI-generated content
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-3 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive 
              ? 'border-purple-500 bg-purple-50 scale-105' 
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              p-4 rounded-full transition-colors
              ${isDragActive ? 'bg-purple-500' : 'bg-purple-100'}
            `}>
              <Upload className={`w-12 h-12 ${isDragActive ? 'text-white' : 'text-purple-600'}`} />
            </div>
            
            <div>
              <p className="text-xl font-semibold text-gray-800 mb-2">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-gray-500">
                or <span className="text-purple-600 font-medium">browse</span> to choose a file
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400 mt-2">
              <span className="px-3 py-1 bg-gray-100 rounded-full">Images (JPG, PNG, GIF)</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">PDF</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">Documents (DOC, DOCX)</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">Text (TXT)</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Maximum file size: 10MB</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-800 font-medium">Analyzing {fileName}...</p>
                <p className="text-blue-600 text-sm">This may take a few moments</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Analysis Failed</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="mt-6 space-y-4">
            {/* File Info */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              {getFileIcon(fileName)}
              <span className="text-gray-700 font-medium truncate">{fileName}</span>
            </div>

            {/* Verdict Card */}
            <div className={`
              p-6 rounded-xl border-2
              ${result.verdict === 'authentic' 
                ? 'bg-green-50 border-green-300' 
                : 'bg-orange-50 border-orange-300'
              }
            `}>
              <div className="flex items-start space-x-4">
                {result.verdict === 'authentic' ? (
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-orange-600 flex-shrink-0" />
                )}
                
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    result.verdict === 'authentic' ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    {result.verdict === 'authentic' ? 'Authentic Content' : 'Potentially AI-Generated'}
                  </h3>
                  
                  {/* Score Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                      <span className="text-lg font-bold text-gray-900">
                        {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          result.verdict === 'authentic' 
                            ? 'bg-gradient-to-r from-green-400 to-green-600' 
                            : 'bg-gradient-to-r from-orange-400 to-orange-600'
                        }`}
                        style={{ width: `${result.score * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Analysis Details:</p>
                    <p className="text-gray-600">{result.reason}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setResult(null);
                setFileName("");
                setError(null);
              }}
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Analyze Another File
            </button>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">99.2%</div>
          <div className="text-white/80 text-sm">Accuracy Rate</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">&lt; 3s</div>
          <div className="text-white/80 text-sm">Analysis Time</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">10MB</div>
          <div className="text-white/80 text-sm">Max File Size</div>
        </div>
      </div>
    </div>
  );
}
