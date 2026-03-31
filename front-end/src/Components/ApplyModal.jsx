import { useRef } from "react";

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
  const fileInputRef = useRef(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Apply options"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        onClose();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[85vh] rounded-2xl border border-white/10 bg-black/98 overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3 px-3.5 py-3 border-b border-white/10">
          <div>
            <div className="text-base font-black">Apply to {selectedJob?.title || "this job"}</div>
            <div className="mt-1 text-xs opacity-80">Choose how you want to add your resume.</div>
          </div>
          <button
            type="button"
            className="border-none bg-transparent text-inherit text-2xl leading-none p-1 opacity-85 hover:opacity-100"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-3.5 overflow-auto">
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              className="w-full text-left rounded-xl px-3 py-3 border border-white/10 bg-white/5 text-inherit cursor-pointer hover:bg-white/10"
              onClick={onBuildClick}
            >
              Build a resume
            </button>
            <button
              type="button"
              className="w-full text-left rounded-xl px-3 py-3 border border-indigo-500/55 bg-indigo-500/15 text-inherit cursor-pointer hover:bg-indigo-500/20"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload resume
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                onResume(f);
              }}
            />
          </div>

          <div className="mt-3 grid grid-cols-[110px_1fr] gap-2.5 items-center">
            <div className="text-xs opacity-80">Selected file:</div>
            <div className="text-sm opacity-95 break-words">{resumeFile ? resumeFile.name : "None"}</div>
          </div>

          {uploadError && (
            <div className="mt-2.5 text-xs p-2 rounded-lg bg-red-600/20 border border-red-600/35">
              {uploadError}
            </div>
          )}
          {uploadUrl && (
            <div className="mt-2.5 text-xs opacity-85">
              Stored at:{" "}
              <a className="text-indigo-400 no-underline hover:underline" href={uploadUrl} target="_blank" rel="noreferrer">
                Open resume
              </a>
            </div>
          )}
        </div>

        <div className="px-3.5 py-3 border-t border-white/10 flex justify-end gap-2.5">
          <button
            type="button"
            className="rounded-xl px-3 py-2.5 border border-white/10 bg-white/5 text-inherit cursor-pointer text-sm hover:bg-white/10"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl px-3 py-2.5 border border-indigo-500/55 bg-indigo-500/15 text-inherit cursor-pointer text-sm disabled:opacity-55"
            disabled={!resumeFile || uploadBusy}
            onClick={onUpload}
          >
            {uploadBusy ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
