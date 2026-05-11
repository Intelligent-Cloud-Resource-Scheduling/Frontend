"use client";

import type {
  ApiEnvelope,
  LoginResponse,
  Plan,
  ProcessCreateResponse,
  ProcessHistory,
  ProcessItem,
  ProcessStatus,
  UploadInit,
  Video
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3500";

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  token?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (options.body) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = (await response.json().catch(() => ({
    success: false,
    message: "The server returned an unreadable response."
  }))) as ApiEnvelope<T>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

export const api = {
  baseUrl: API_BASE_URL,
  register: (body: { name: string; email: string; password: string }) =>
    request<LoginResponse>("/users/register", { method: "POST", body }),
  loginUser: (body: { email: string; password: string }) =>
    request<LoginResponse>("/users/login", { method: "POST", body }),
  loginAdmin: (body: { email: string; password: string }) =>
    request<LoginResponse>("/admins/login", { method: "POST", body }),
  listVideos: (token: string) => request<Video[]>("/videos", { token }),
  getVideo: (token: string, videoUuid: string) => request<Video>(`/videos/${videoUuid}`, { token }),
  initVideoUpload: (
    token: string,
    body: {
      duration: number;
      size: number;
      name: string;
    }
  ) => request<UploadInit>("/videos/init-video-uploader", { method: "POST", token, body }),
  confirmVideoUpload: (token: string, videoUuid: string) =>
    request<Video>(`/videos/confirm-upload/${videoUuid}`, { token }),
  deleteVideo: (token: string, videoUuid: string) =>
    request<Video>(`/videos/confirm-delete/${videoUuid}`, { method: "DELETE", token }),
  listPlans: (token: string) => request<Plan[]>("/plans", { token }),
  getPlan: (token: string, planUuid: string) => request<Plan>(`/plans/${planUuid}`, { token }),
  calculateDuration: (token: string, videoUuid: string, body: { quality: string; fps: number }) =>
    request<{ duration: number }>(`/processes/calc-duration/${videoUuid}`, {
      method: "POST",
      token,
      body
    }),
  createProcess: (token: string, videoUuid: string, body: { quality: string; fps: number }) =>
    request<ProcessCreateResponse>(`/processes/create/${videoUuid}`, {
      method: "POST",
      token,
      body
    }),
  deleteProcess: (token: string, processUuid: string) =>
    request<null>(`/processes/confirm-delete/${processUuid}`, { method: "DELETE", token }),
  getProcessStatus: (token: string, processUuid: string) =>
    request<ProcessStatus>(`/processes/current-status/${processUuid}`, { token }),
  getProcessHistory: (token: string, processUuid: string) =>
    request<ProcessHistory[]>(`/processes/history/${processUuid}`, { token }),
  listProcesses: (token: string) => request<ProcessItem[]>("/processes", { token })
};

export function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File,
  handlers: {
    onProgress: (percent: number) => void;
    signal?: AbortSignal;
  }
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        handlers.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Upload failed because the network request could not complete."));
    xhr.onabort = () => reject(new Error("Upload canceled."));
    handlers.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
