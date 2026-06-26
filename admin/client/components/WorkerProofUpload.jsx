import { useState } from "react";
import { Upload, Loader2, ImageIcon, ShieldCheck } from "lucide-react";

// Worker proof-of-work uploader (§8.1). A worker can't mark Completed without
// uploading a photo/video, which the backend then runs through the same Gemini
// fake-detection pipeline used for citizen reports.
export default function WorkerProofUpload({ onComplete }) {
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onFile = (file) => {
    setError(null);
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError("File too large (max 15MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!base64) {
      setError("Please attach a proof photo/video.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onComplete({ workerProofBase64: base64 });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-1">
      <ShieldCheck className="h-5 w-5 text-indigo-400" />
      <h4 className="font-bold text-white">Worker Proof-of-Work</h4>
    </div>
    <p className="text-xs text-slate-400 mb-4">
      A fix cannot be marked complete without proof. The upload is checked by the same AI that
      screens citizen reports — closing the four-sided accountability loop.
    </p>

    <label className="block border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors">
      <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      {preview ? (
        preview.match(/^data:video/) ? (
          <video src={preview} controls className="max-h-40 mx-auto rounded-lg" />
        ) : (
          <img src={preview} alt="proof preview" className="max-h-40 mx-auto rounded-lg" />
        )
      ) : (
        <div className="text-slate-400">
          <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <span className="text-sm">Click to upload proof photo/video</span>
        </div>
      )}
    </label>

    {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

    <button
      onClick={submit}
      disabled={!base64 || submitting}
      className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
    >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      Mark Complete with Proof
    </button>
  </div>;
}
