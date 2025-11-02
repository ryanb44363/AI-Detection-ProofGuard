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
      return <Image className="w-4 h-4" />;
    } else if (ext === 'pdf') {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Detect AI Content
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            100% Automatically and <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">Free</span>
          </p>
        </div>

        {/* Main Upload Area */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left side - Example */}
          <div className="flex-1 max-w-md">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                <Upload className="w-16 h-16 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Right side - Upload */}
          <div className="flex-1 max-w-md">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {!result && !loading && (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <button className="mb-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                    Upload File
                  </button>
                  <p className="text-gray-600 text-sm mb-4">
                    or drop a file
                  </p>
                  <p className="text-xs text-gray-500">
                    paste image or <span className="text-blue-600 underline">URL</span>
                  </p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Analyzing {fileName}...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-900 font-semibold">Analysis Failed</p>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    {getFileIcon(fileName)}
                    <span className="text-gray-700 font-medium text-sm truncate">{fileName}</span>
                  </div>

                  {/* Verdict */}
                  <div className={`
                    p-6 rounded-lg border-2
                    ${result.verdict === 'authentic' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-orange-50 border-orange-200'
                    }
                  `}>
                    <div className="flex items-start space-x-4">
                      {result.verdict === 'authentic' ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-2 ${
                          result.verdict === 'authentic' ? 'text-green-900' : 'text-orange-900'
                        }`}>
                          {result.verdict === 'authentic' ? 'Authentic Content' : 'Potentially AI-Generated'}
                        </h3>
                        
                        {/* Score */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-gray-700 uppercase">Confidence</span>
                            <span className="text-lg font-bold text-gray-900">
                              {(result.score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                result.verdict === 'authentic' 
                                  ? 'bg-green-500' 
                                  : 'bg-orange-500'
                              }`}
                              style={{ width: `${result.score * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Details */}
                        <p className="text-sm text-gray-700">{result.reason}</p>
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
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    Analyze Another File
                  </button>
                </div>
              )}
            </div>

            {/* File type info */}
            {!result && !loading && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">No file?</p>
                <p className="text-xs text-gray-500">Try one of these:</p>
                <div className="flex justify-center space-x-2 mt-3">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  By uploading a file or URL you agree to our Terms of Service. To learn more<br />
                  about how ProofGuard handles your data, check our Privacy Policy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
