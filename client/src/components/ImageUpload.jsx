import { useState, useRef, useEffect } from "react";
import { uploadImage } from "../services/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ImageUpload = ({ value, onChange, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewInfo, setPreviewInfo] = useState(null); // { name, size, localUrl }
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || "");

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewInfo?.localUrl && previewInfo.localUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewInfo.localUrl);
      }
    };
  }, [previewInfo]);

  // Sync manualUrl with value if value changes externally
  useEffect(() => {
    setManualUrl(value || "");
  }, [value]);

  const validateFile = (file) => {
    if (!file) return "No file selected";
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a JPG, PNG, or WEBP image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`;
    }
    return null;
  };

  const handleFile = async (file) => {
    setError("");
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewInfo({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      localUrl,
    });

    try {
      setUploading(true);
      const res = await uploadImage(file);
      if (res?.url) {
        onChange(res.url);
      } else {
        throw new Error("Upload did not return an image URL.");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (previewInfo?.localUrl && previewInfo.localUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewInfo.localUrl);
    }
    setPreviewInfo(null);
    setError("");
    onChange("");
    setManualUrl("");
  };

  const handleTriggerPicker = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const activeImage = previewInfo?.localUrl || value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
          Dish Photo / Image *
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-bold text-stone-500 hover:text-stone-800 underline cursor-pointer"
        >
          {showUrlInput ? "← Upload from Device" : "Paste Web URL Instead"}
        </button>
      </div>

      {/* MANUAL URL FALLBACK */}
      {showUrlInput ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={manualUrl}
              onChange={(e) => {
                setManualUrl(e.target.value);
                onChange(e.target.value);
              }}
              className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm font-medium outline-none focus:border-stone-400 focus:bg-white"
            />
            {manualUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100"
              >
                Clear
              </button>
            )}
          </div>
          {manualUrl && (
            <div className="h-28 w-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative">
              <img src={manualUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      ) : activeImage ? (
        /* IMAGE PREVIEW CARD */
        <div className="relative rounded-2xl border border-stone-200 bg-stone-50/70 p-4 flex flex-col sm:flex-row items-center gap-4 transition hover:border-stone-300">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <img
              src={activeImage}
              alt="Uploaded dish preview"
              className="h-full w-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-stone-900/60 flex flex-col items-center justify-center text-white">
                <span className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                <span className="text-[10px] font-bold">Uploading...</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="text-emerald-600 font-bold text-xs">✓ Image Attached</span>
              {uploading && (
                <span className="text-xs text-amber-600 font-semibold animate-pulse">
                  (Saving to storage...)
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-stone-800 truncate max-w-xs mt-0.5">
              {previewInfo?.name || "Dish Photograph"}
            </p>
            {previewInfo?.size && (
              <span className="text-[11px] text-stone-400 font-mono block">
                {previewInfo.size}
              </span>
            )}

            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                disabled={uploading || disabled}
                onClick={handleTriggerPicker}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 hover:border-stone-400 transition cursor-pointer disabled:opacity-50"
              >
                Change Photo 📸
              </button>
              <button
                type="button"
                disabled={uploading || disabled}
                onClick={handleRemove}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* DRAG & DROP UPLOAD ZONE */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleTriggerPicker}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
            dragActive
              ? "border-rose-500 bg-rose-50/70 scale-[1.01]"
              : "border-stone-300 bg-stone-50/50 hover:border-stone-400 hover:bg-stone-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-stone-200 shadow-sm text-2xl mb-2">
            {uploading ? (
              <span className="inline-block w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              "📸"
            )}
          </div>

          <p className="text-sm font-black text-stone-800">
            {uploading ? "Processing Upload..." : "Drop dish photo here"}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            or click to browse from device gallery / camera
          </p>

          <button
            type="button"
            disabled={uploading || disabled}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800 transition"
          >
            <span>📁</span>
            <span>Choose Image</span>
          </button>

          <span className="mt-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            JPG • PNG • WEBP (Max 5 MB)
          </span>
        </div>
      )}

      {/* HIDDEN NATIVE FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
