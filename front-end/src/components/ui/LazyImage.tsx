import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, ImageOff, ZoomIn, X } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  maxHeightClass?: string;
  enableZoom?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = "Hình minh họa",
  className = "",
  wrapperClassName = "",
  maxHeightClass = "max-h-56",
  enableZoom = true,
}) => {
  const [isInView, setIsInView] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Nếu trình duyệt không hỗ trợ IntersectionObserver, fallback tải luôn
    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        // Kích hoạt nạp trước khi người dùng cuộn tới cách ảnh 200px
        rootMargin: "200px 0px",
        threshold: 0.01,
      }
    );

    const currentElem = containerRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`relative inline-block overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 transition-all ${wrapperClassName}`}
      >
        {/* Placeholder / Skeleton khi chưa vào viewport hoặc đang tải */}
        {(!isInView || (!isLoaded && !hasError)) && (
          <div
            className={`w-full min-h-[140px] flex flex-col items-center justify-center p-4 text-slate-400 dark:text-slate-500 animate-pulse select-none ${maxHeightClass}`}
          >
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-[11px] font-medium text-slate-400">Đang tải ảnh khi cuộn tới...</span>
          </div>
        )}

        {/* Lỗi tải ảnh */}
        {hasError && (
          <div
            className={`w-full min-h-[100px] flex items-center justify-center p-3 gap-2 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-medium ${maxHeightClass}`}
          >
            <ImageOff className="w-4 h-4 shrink-0" />
            <span>Không thể hiển thị ảnh</span>
          </div>
        )}

        {/* Thẻ Image thật - Chỉ nạp mạng khi đã vào viewport */}
        {isInView && !hasError && (
          <div className="relative group">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={`w-auto max-w-full rounded-xl object-contain transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
              } ${maxHeightClass} ${className} ${enableZoom ? "cursor-zoom-in" : ""}`}
              onClick={() => {
                if (enableZoom && isLoaded) setIsZoomOpen(true);
              }}
            />

            {/* Hover overlay for zoom */}
            {enableZoom && isLoaded && (
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                title="Phóng to ảnh"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Lightbox phóng to ảnh rõ nét */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LazyImage;
