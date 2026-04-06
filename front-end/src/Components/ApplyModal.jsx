import { Upload, FileText, Plus, X } from "lucide-react";

export default function ApplyModal({
  open,
  selectedJob,
  resumeFile,
  uploadBusy,
  uploadError,
  uploadUrl,
  onClose,
  onResume,
  onUpload,
  onBuildClick,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Apply for Position</h2>
            <p className="text-emerald-100 mt-1">{selectedJob?.title || selectedJob?.role_title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-emerald-700/50 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-emerald-300 rounded-xl p-8 bg-emerald-50 text-center hover:bg-emerald-100 transition">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-3 rounded-full">
                <Upload className="text-emerald-600" size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upload Your Resume</h3>
                <p className="text-sm text-gray-600 mt-1">PDF, DOC, or DOCX format</p>
              </div>
            </div>

            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={(e) => onResume(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:-translate-y-1">
                <Upload size={18} /> Choose File
              </div>
            </label>

            {resumeFile && (
              <div className="mt-4 p-3 bg-white rounded-lg border-2 border-emerald-300">
                <p className="text-sm text-emerald-700 font-semibold">
                  ✓ Selected: {resumeFile.name}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 font-semibold">Error: {uploadError}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadUrl && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <p className="text-green-800 font-semibold">✓ {uploadUrl}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={onUpload}
              disabled={!resumeFile || uploadBusy}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadBusy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FileText size={20} /> Upload & Apply
                </>
              )}
            </button>

            <button
              onClick={onBuildClick}
              className="w-full bg-white border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Build Resume Instead
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
