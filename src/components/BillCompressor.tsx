"use client";

import { useState, useRef, type ChangeEvent } from "react";

interface BillCompressorProps {
  onCompressed: (base64: string) => void;
  existingImage?: string;
}

const MAX_SIZE_KB = 80;
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.5;

export default function BillCompressor({
  onCompressed,
  existingImage,
}: BillCompressorProps) {
  const [preview, setPreview] = useState<string | null>(existingImage ?? null);
  const [error, setError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File) => {
    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate size before compression (max 10MB raw)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setIsCompressing(true);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        // Calculate dimensions (max 800px wide, maintain aspect ratio)
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Failed to process image");
          setIsCompressing(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG Base64, adjust quality to stay under 80KB
        let quality = JPEG_QUALITY;
        let base64 = canvas.toDataURL("image/jpeg", quality);

        // Binary search for quality that fits under 80KB
        while (
          base64.length > MAX_SIZE_KB * 1024 &&
          quality > 0.1
        ) {
          quality -= 0.1;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        if (base64.length > MAX_SIZE_KB * 1024) {
          setError(`Image too large after compression (${Math.round(base64.length / 1024)}KB). Try a smaller image.`);
          setIsCompressing(false);
          return;
        }

        setPreview(base64);
        onCompressed(base64);
        setIsCompressing(false);
      };

      img.onerror = () => {
        setError("Failed to load image");
        setIsCompressing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setIsCompressing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onCompressed("");
  };

  return (
    <div className="bill-compressor">
      <label className="compressor-label">Bill Photo (optional)</label>

      {preview ? (
        <div className="compressor-preview">
          <img src={preview} alt="Bill photo" className="preview-img" />
          <button
            type="button"
            className="remove-btn"
            onClick={handleRemove}
            disabled={isCompressing}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`compressor-upload glass ${isCompressing ? "loading" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing}
        >
          {isCompressing ? (
            <span>Compressing...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Add Bill Photo</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}