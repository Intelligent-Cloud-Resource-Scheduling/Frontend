"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleDotDashed,
  Film,
  FolderKanban,
  Gauge,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, uploadFileToSignedUrl } from "@/lib/api";
import { formatBytes, formatDuration, readableDate } from "@/lib/utils";
import type { Plan, ProcessHistory, ProcessItem, Session, Video } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Panel, SectionHeading } from "@/components/ui/panel";
import { useProcessStatus } from "@/lib/useProcessStatus";

type Tab = "overview" | "videos" | "processes" | "plans";

export function UserDashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [videos, setVideos] = useState<Video[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [history, setHistory] = useState<ProcessHistory[]>([]);
  const [selectedProcessUuid, setSelectedProcessUuid] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const [videoResponse, planResponse, processResponse] = await Promise.all([
        api.listVideos(session.token),
        api.listPlans(session.token),
        api.listProcesses(session.token)
      ]);
      setVideos(videoResponse.data ?? []);
      setPlans(planResponse.data ?? []);
      setProcesses(processResponse.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const activeProcessUuids = processes
    .filter((item) => !["FINISHED", "INTERRUPTED"].includes((item.status ?? "PENDING").toUpperCase()))
    .map((item) => item.uuid);

  useProcessStatus(activeProcessUuids, (processUuid, status) => {
    setProcesses((current) =>
      current.map((item) =>
        item.uuid === processUuid ? { ...item, status } : item
      )
    );
  });

  const uploadedVideos = videos.filter((video) => video.is_uploaded && !video.is_deleted);
  const activeJobs = processes.filter((item) => !["COMPLETED", "FAILED"].includes((item.status ?? "PENDING").toUpperCase()));
  const completedJobs = processes.filter((item) => (item.status ?? "").toUpperCase() === "COMPLETED");
  const currentPlan = plans.find((plan) => plan.uuid === session.user.plan_uuid) ?? plans.find((plan) => !plan.is_hidden);

  async function showHistory(processUuid: string) {
    setSelectedProcessUuid(processUuid);
    const response = await api.getProcessHistory(session.token, processUuid);
    setHistory(response.data ?? []);
  }

  const navItems: Array<[Tab, string, LucideIcon]> = [
    ["overview", "Overview", BarChart3],
    ["videos", "Video management", Film],
    ["processes", "Process management", FolderKanban],
    ["plans", "Plans", Rocket]
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-6">
      <aside className="h-fit rounded-lg border border-border bg-white p-2 shadow-soft">
        {navItems.map(([key, label, Icon]) => (
          <button
            key={key as string}
            className={`focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold ${
              tab === key ? "bg-violet-50 text-primary" : "text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setTab(key as Tab)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </aside>
      <section className="space-y-5">
        {error ? <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <Panel className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading dashboard...
          </Panel>
        ) : null}
        {!isLoading && tab === "overview" ? (
          <OverviewPanel
            totalUploads={videos.length}
            activeJobs={activeJobs.length}
            completedJobs={completedJobs.length}
            currentPlan={currentPlan}
            videos={videos}
            processes={processes}
            onRefresh={loadData}
          />
        ) : null}
        {!isLoading && tab === "videos" ? (
          <VideoManagement token={session.token} videos={videos} onChanged={loadData} />
        ) : null}
        {!isLoading && tab === "processes" ? (
          <ProcessManagement
            token={session.token}
            videos={uploadedVideos}
            processes={processes}
            history={history}
            selectedProcessUuid={selectedProcessUuid}
            onChanged={loadData}
            onHistory={showHistory}
          />
        ) : null}
        {!isLoading && tab === "plans" ? <PlansPanel plans={plans} currentPlanUuid={session.user.plan_uuid} /> : null}
      </section>
    </div>
  );
}

function OverviewPanel({
  totalUploads,
  activeJobs,
  completedJobs,
  currentPlan,
  videos,
  processes,
  onRefresh
}: {
  totalUploads: number;
  activeJobs: number;
  completedJobs: number;
  currentPlan?: Plan;
  videos: Video[];
  processes: ProcessItem[];
  onRefresh: () => Promise<void>;
}) {
  const weeklyLimit = currentPlan?.max_uploads_per_week ?? 0;
  const [now] = useState(() => Date.now());
  const weeklyUsed = videos.filter((video) => now - new Date(video.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const bars = useMemo(() => Array.from({ length: 7 }, (_, index) => Math.max(8, ((weeklyUsed + index * 2) % 9) * 10)), [weeklyUsed]);
  const stats: Array<[string, string | number, LucideIcon]> = [
    ["Total uploads", totalUploads, UploadCloud],
    ["Active jobs", activeJobs, Activity],
    ["Completed jobs", completedJobs, CheckCircle2],
    ["Current plan", currentPlan?.name ?? "No plan", Rocket],
    ["Weekly usage", `${weeklyUsed}/${weeklyLimit || "unlimited"}`, Gauge]
  ];

  return (
    <div className="space-y-5">
      <Panel>
        <SectionHeading
          title="Overview"
          subtitle="Track uploads, processing activity, and weekly plan usage."
          action={
            <Button variant="secondary" onClick={() => void onRefresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map(([label, value, Icon]) => (
            <div key={label} className="rounded-lg border border-border bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <SectionHeading title="Weekly upload usage" subtitle="A compact usage signal for the current week." />
          <div className="flex h-40 items-end gap-2">
            {bars.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-violet-500" style={{ height: `${height}%` }} />
                <span className="text-xs text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionHeading title="Recent activity" subtitle="Latest videos and process changes." />
          <div className="space-y-3">
            {[...videos.slice(0, 3), ...processes.slice(0, 3)].length === 0 ? (
              <EmptyState title="No activity yet" body="Upload a video or start a process to see activity here." />
            ) : (
              <>
                {videos.slice(0, 3).map((video) => (
                  <ActivityRow key={video.uuid} label={video.name} value={video.is_uploaded ? "Uploaded" : "Waiting"} date={video.created_at} />
                ))}
                {processes.slice(0, 3).map((process) => (
                  <ActivityRow
                    key={process.uuid}
                    label={`${process.quality} at ${process.fps} fps`}
                    value={process.status ?? "PENDING"}
                    date={process.created_at}
                  />
                ))}
              </>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ActivityRow({ label, value, date }: { label: string; value: string; date?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-muted-foreground">{readableDate(date)}</p>
      </div>
      <Badge tone={value}>{value}</Badge>
    </div>
  );
}

function VideoManagement({
  token,
  videos,
  onChanged
}: {
  token: string;
  videos: Video[];
  onChanged: () => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <UploadPanel token={token} onUploaded={onChanged} />
      <Panel>
        <SectionHeading title="Videos" subtitle="Uploaded and pending videos tied to your account." />
        {videos.length === 0 ? (
          <EmptyState title="No videos found" body="Use the upload area above to add your first source video." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Size</th>
                  <th className="py-3 pr-4">Duration</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.uuid} className="border-b border-border last:border-0">
                    <td className="max-w-[260px] truncate py-3 pr-4 font-semibold text-slate-900">{video.name}</td>
                    <td className="py-3 pr-4">{formatBytes(video.size)}</td>
                    <td className="py-3 pr-4">{formatDuration(video.duration)}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={video.is_deleted ? "failed" : video.is_uploaded ? "completed" : "pending"}>
                        {video.is_deleted ? "Deleted" : video.is_uploaded ? "Uploaded" : "Pending"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{readableDate(video.created_at)}</td>
                    <td className="py-3 pr-4">
                      <Button
                        variant="ghost"
                        disabled={video.is_deleted}
                        onClick={async () => {
                          await api.deleteVideo(token, video.uuid);
                          await onChanged();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function UploadPanel({ token, onUploaded }: { token: string; onUploaded: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(10);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function readVideoDuration(selected: File) {
    return new Promise<number>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(Math.max(1, Math.round(video.duration || 10)));
      };
      video.onerror = () => resolve(10);
      video.src = URL.createObjectURL(selected);
    });
  }

  async function selectFile(selected?: File) {
    if (!selected) return;
    setFile(selected);
    setStatus("idle");
    setProgress(0);
    setMessage("");
    setDuration(await readVideoDuration(selected));
  }

  async function startUpload() {
    if (!file) return;
    setStatus("uploading");
    setMessage("Requesting a private upload link...");
    abortRef.current = new AbortController();

    try {
      const init = await api.initVideoUpload(token, {
        duration,
        size: file.size,
        name: file.name
      });
      setMessage("Uploading directly to object storage...");
      await uploadFileToSignedUrl(init.data.upload_url, file, {
        onProgress: setProgress,
        signal: abortRef.current.signal
      });
      setMessage("Confirming upload with the backend...");
      await api.confirmVideoUpload(token, init.data.video_uuid);
      setStatus("done");
      setProgress(100);
      setMessage("Upload confirmed.");
      await onUploaded();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  return (
    <Panel>
      <SectionHeading title="Upload video" subtitle="Drag a source video here, then upload it through the signed URL workflow." />
      <div
        className="rounded-lg border border-dashed border-violet-300 bg-violet-50/60 p-6 text-center"
        onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          void selectFile(event.dataTransfer.files[0]);
        }}
      >
        <UploadCloud className="mx-auto h-9 w-9 text-primary" />
        <p className="mt-3 text-sm font-semibold text-slate-900">{file ? file.name : "Drop your video file here"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{file ? `${formatBytes(file.size)} / ${formatDuration(duration)}` : "MP4 or any backend-supported video format"}</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) => void selectFile(event.target.files?.[0])}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
        </div>
      </div>
      {status !== "idle" ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button disabled={!file || status === "uploading"} onClick={() => void startUpload()}>
          {status === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {status === "error" ? "Retry upload" : "Start upload"}
        </Button>
        <Button variant="secondary" disabled={status !== "uploading"} onClick={() => abortRef.current?.abort()}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </Panel>
  );
}

function ProcessManagement({
  token,
  videos,
  processes,
  history,
  selectedProcessUuid,
  onChanged,
  onHistory
}: {
  token: string;
  videos: Video[];
  processes: ProcessItem[];
  history: ProcessHistory[];
  selectedProcessUuid: string;
  onChanged: () => Promise<void>;
  onHistory: (processUuid: string) => Promise<void>;
}) {
  const [videoUuid, setVideoUuid] = useState("");
  const [quality, setQuality] = useState("720p");
  const [fps, setFps] = useState(30);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function calculate() {
    if (!videoUuid) return;
    const response = await api.calculateDuration(token, videoUuid, { quality, fps });
    setEstimate(response.data.duration);
    setMessage("Estimated duration calculated.");
  }

  async function create() {
    if (!videoUuid) return;
    await api.createProcess(token, videoUuid, { quality, fps });
    setEstimate(null);
    setMessage("Process created successfully.");
    await onChanged();
  }

  return (
    <div className="space-y-5">
      <Panel>
        <SectionHeading title="Create process" subtitle="Choose a confirmed upload, target resolution, and FPS before starting processing." />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.6fr]">
          <label className="block text-sm font-medium text-slate-700">
            Video
            <Select className="mt-2" value={videoUuid} onChange={(event) => setVideoUuid(event.target.value)}>
              <option value="">Select uploaded video</option>
              {videos.map((video) => (
                <option key={video.uuid} value={video.uuid}>
                  {video.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Target resolution
            <Select className="mt-2" value={quality} onChange={(event) => setQuality(event.target.value)}>
              {["720p", "1080p", "2K", "4k"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            FPS
            <Select className="mt-2" value={fps} onChange={(event) => setFps(Number(event.target.value))}>
              {[30, 60].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" disabled={!videoUuid} onClick={() => void calculate()}>
            <CircleDotDashed className="h-4 w-4" />
            Calculate estimate
          </Button>
          <Button disabled={!videoUuid} onClick={() => void create()}>
            <Play className="h-4 w-4" />
            Start process
          </Button>
          {estimate !== null ? <Badge>{formatDuration(estimate)} estimated</Badge> : null}
          {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
        </div>
      </Panel>
      <Panel>
        <SectionHeading title="Process jobs" subtitle="Status updates refresh automatically for active jobs." />
        {processes.length === 0 ? (
          <EmptyState title="No processing jobs" body="Create a process from an uploaded video to monitor job state changes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-3 pr-4">Process</th>
                  <th className="py-3 pr-4">Options</th>
                  <th className="py-3 pr-4">Resources</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr key={process.uuid} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{process.uuid.slice(0, 8)}</td>
                    <td className="py-3 pr-4">
                      {process.quality} / {process.fps} fps / {formatDuration(process.duration)}
                    </td>
                    <td className="py-3 pr-4">
                      {process.cores} cores / {process.memory} MB
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={process.status}>{process.status ?? "PENDING"}</Badge>
                    </td>
                    <td className="py-3 pr-4">{readableDate(process.created_at)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => void onHistory(process.uuid)}>
                          History
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            await api.deleteProcess(token, process.uuid);
                            await onChanged();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {selectedProcessUuid ? (
        <Panel>
          <SectionHeading title="Process history" subtitle={`Newest state changes for ${selectedProcessUuid.slice(0, 8)}.`} />
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2">
                <Badge tone={item.status}>{item.status}</Badge>
                <span className="text-sm text-muted-foreground">{readableDate(item.changed_at)}</span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function PlansPanel({ plans, currentPlanUuid }: { plans: Plan[]; currentPlanUuid?: string | null }) {
  return (
    <Panel>
      <SectionHeading title="Plans" subtitle="Available upload plans returned by the backend." />
      {plans.length === 0 ? (
        <EmptyState title="No plans returned" body="The plans endpoint did not return any visible plans." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.uuid} className="rounded-lg border border-border bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                {plan.uuid === currentPlanUuid ? <Badge>Current</Badge> : null}
              </div>
              <p className="mt-5 text-3xl font-bold text-slate-950">${plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.max_uploads_per_week} uploads per week</p>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
