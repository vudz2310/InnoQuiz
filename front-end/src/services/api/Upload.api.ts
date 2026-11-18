import { privateApi } from "../../utils/axiosInstance";

export interface UploadResponse {
  message: string;
  url: string;
  relativeUrl?: string;
  storageKey?: string;
  avatarKey?: string;
  avatarUrl?: string;
  coverKey?: string;
  coverUrl?: string;
  filename?: string;
  size?: number;
  mimetype?: string;
}

export const uploadApi = {
  // 1. Upload User Avatar (512x512 WebP)
  async uploadAvatar(file: File): Promise<{ avatarUrl: string; avatarKey: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await privateApi.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  // 2. Upload Quiz Cover (1280x720 WebP)
  async uploadQuizCover(quizId: string, file: File): Promise<{ coverUrl: string; coverKey: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await privateApi.post(`/upload/quiz-cover/${quizId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  // 3. Upload Question Image
  async uploadQuestionImage(
    questionId: string,
    file: File,
  ): Promise<{ id: string; storageKey: string; url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = `/upload/questions/${questionId}/images`;

    const { data } = await privateApi.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.data;
  },

  async uploadAnswerImage(
    answerId: string,
    file: File,
  ): Promise<{ id: string; storageKey: string; url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = `/upload/answers/${answerId}/images`;
    const { data } = await privateApi.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.data;
  },

  // Delete Question Media
  async deleteQuestionMedia(mediaId: string): Promise<void> {
    await privateApi.delete(`/upload/questions/media/${mediaId}`);
  },

  // 4. Upload Document for Import (PDF / DOCX)
  async uploadImportDocument(file: File): Promise<{ importId: string; storageKey: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await privateApi.post("/upload/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.data;
  },

  // Generic Image Upload
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await privateApi.post<UploadResponse>(
      "/upload/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return data;
  },
};
