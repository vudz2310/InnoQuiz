import React, { useRef, useState } from "react";
import { ImagePlus, Upload, Trash2, Loader2, Sparkles, ImageIcon } from "lucide-react";
import { uploadApi } from "../../../services/api/Upload.api";
import { getMediaUrl } from "../../../utils/media";

interface QuizCoverUploaderProps {
  quizId?: string;
  coverUrl?: string | null;
  onCoverChange: (coverUrl: string, coverKey?: string, file?: File) => void;
  onCoverRemove: () => void;
  disabled?: boolean;
}

export const QuizCoverUploader: React.FC<QuizCoverUploaderProps> = ({
  quizId,
  coverUrl,
  onCoverChange,
  onCoverRemove,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const formattedCoverUrl = getMediaUrl(coverUrl);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Dung lượng ảnh không được vượt quá 10MB.");
      return;
    }

    setError(null);
    setPreviewError(false);

    // If quizId is available (e.g. edit page), upload directly to server
    if (quizId) {
      try {
        setUploading(true);
        const res = await uploadApi.uploadQuizCover(quizId, file);
        onCoverChange(res.coverUrl, res.coverKey, file);
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { message?: string; code?: string } } };
        setError(apiError.response?.data?.message || "Không thể tải lên ảnh bìa.");
      } finally {
        setUploading(false);
      }
    } else {
      // Local preview for new quizzes before saving
      const localPreviewUrl = URL.createObjectURL(file);
      onCoverChange(localPreviewUrl, undefined, file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />
          <span>Ảnh bìa đề thi</span>
          <span className="text-slate-400 font-normal text-[11px]">(Tỉ lệ 16:9, tối đa 10MB)</span>
        </label>

        {coverUrl && !disabled && (
          <button
            type="button"
            onClick={onCoverRemove}
            className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa ảnh bìa</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {formattedCoverUrl && !previewError ? (
        // Preview State
        <div className="relative aspect-[16/7] sm:aspect-[16/6] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group bg-slate-900">
          <img
            src={formattedCoverUrl}
            alt="Quiz cover"
            onError={() => setPreviewError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-white flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Ảnh bìa đang hiển thị
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Thay ảnh khác</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Upload Dropzone
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`aspect-[16/6] w-full rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
            dragOver
              ? "border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/30"
              : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600/50 bg-slate-50/50 dark:bg-[#0B0F19]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Đang xử lý và tải lên ảnh bìa WebP...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center shadow-xs">
                <ImagePlus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Kéo thả ảnh bìa vào đây hoặc <span className="text-[#4F46E5] dark:text-indigo-400 underline">chọn từ thiết bị</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Khuyến nghị ảnh ngang 1280x720px để hiển thị sắc nét nhất trên thư viện đề thi
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
