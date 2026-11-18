import axios from "axios";

interface ApiErrorData {
  message?: unknown;
  code?: unknown;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError<ApiErrorData>(error)) {
    return undefined;
  }

  const code = error.response?.data?.code;
  return typeof code === "string" ? code : undefined;
}
