export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  requestId?: string;
};

export type AppRole = "user" | "admin";

export type User = {
  id: number;
  uuid: string;
  email: string;
  name: string;
  plan_uuid?: string | null;
  created_at?: string;
};

export type Session = {
  role: AppRole;
  token: string;
  user: User;
};

export type LoginResponse = {
  user: User;
  token: string;
};

export type Video = {
  id: number;
  uuid: string;
  user_uuid: string;
  s3_key: string;
  name: string;
  size: number;
  duration: number;
  is_deleted: boolean;
  is_uploaded: boolean;
  created_at: string;
};

export type UploadInit = {
  upload_url: string;
  video_uuid: string;
  s3_key: string;
};

export type Plan = {
  id: number;
  uuid: string;
  name: string;
  description: string;
  price: number;
  max_uploads_per_week: number;
  is_hidden: boolean;
  created_at: string;
};

export type ProcessItem = {
  id: number;
  uuid: string;
  user_uuid: string;
  video_uuid: string;
  quality: string;
  fps: number;
  duration: number;
  cores: number;
  memory: number;
  batch_uuid?: string | null;
  created_at: string;
  status?: string;
};

export type ProcessHistory = {
  id: number;
  process_uuid: string;
  status: string;
  changed_at: string;
};

export type ProcessCreateResponse = {
  process: ProcessItem;
  process_history: ProcessHistory;
};

export type ProcessStatus = {
  processUuid: string;
  status: string;
  updatedAt: string;
};
