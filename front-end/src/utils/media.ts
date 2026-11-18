/**
 * Format media URL to ensure proper backend origin resolution for /storage and /uploads
 */
export const getMediaUrl = (path?: string | null): string => {
  if (!path) return "";
  
  // Already absolute or blob preview
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const rawBase = import.meta.env.VITE_BASE_URL || "http://localhost:3200/v1";
  const backendOrigin = rawBase.replace(/\/v1\/?$/, "").replace(/\/api\/?$/, "");
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If path doesn't start with /storage/ or /uploads/, normalize to /storage/...
  if (!cleanPath.startsWith("/storage/") && !cleanPath.startsWith("/uploads/")) {
    cleanPath = `/storage${cleanPath}`;
  }

  return `${backendOrigin}${cleanPath}`;
};
