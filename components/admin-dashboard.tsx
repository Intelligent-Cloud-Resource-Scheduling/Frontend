"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Banknote,
  Boxes,
  Cpu,
  Eye,
  EyeOff,
  FlaskConical,
  HardDrive,
  LayoutDashboard,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Square,
  Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { formatDuration, readableDate } from "@/lib/utils";
import type { Plan, Session, Vm, VmHistory, VmSpentCost, VmStatus } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Panel, SectionHeading } from "@/components/ui/panel";

type AdminTab = "overview" | "vms" | "plans" | "ga";

const emptyPlanForm = {
  name: "",
  description: "",
  price: 0,
  max_uploads_per_week: 10
};

export function AdminDashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [vms, setVms] = useState<Vm[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const [vmResponse, planResponse] = await Promise.all([
        api.listVms(session.token),
        api.listPlans(session.token)
      ]);
      setVms(vmResponse.data ?? []);
      setPlans(planResponse.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const navItems: Array<[AdminTab, string, LucideIcon]> = [
    ["overview", "Overview", LayoutDashboard],
    ["vms", "VM management", Server],
    ["plans", "Plans management", Boxes],
    ["ga", "GA tester", FlaskConical]
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-6">
      <aside className="h-fit rounded-lg border border-border bg-white p-2 shadow-soft">
        {navItems.map(([key, label, Icon]) => (
          <button
            key={key}
            className={`focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold ${
              tab === key ? "bg-violet-50 text-primary" : "text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setTab(key)}
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
            Loading admin controls...
          </Panel>
        ) : null}
        {!isLoading && tab === "overview" ? <AdminOverview vms={vms} plans={plans} onRefresh={loadData} /> : null}
        {!isLoading && tab === "vms" ? <VmManagement token={session.token} vms={vms} onChanged={loadData} /> : null}
        {!isLoading && tab === "plans" ? <PlanManagement token={session.token} plans={plans} onChanged={loadData} /> : null}
        {!isLoading && tab === "ga" ? <GaTesterPlaceholder /> : null}
      </section>
    </div>
  );
}

function AdminOverview({ vms, plans, onRefresh }: { vms: Vm[]; plans: Plan[]; onRefresh: () => Promise<void> }) {
  const running = vms.filter((vm) => (vm.aws_state ?? vm.status).toLowerCase() === "running").length;
  const visiblePlans = plans.filter((plan) => !plan.is_hidden).length;
  const totalCost = vms.reduce((sum, vm) => sum + Number(vm.cost ?? 0), 0);
  const stats: Array<[string, string | number, LucideIcon]> = [
    ["VMs", vms.length, Server],
    ["Running", running, Activity],
    ["Visible plans", visiblePlans, Boxes],
    ["VM cost", totalCost, Banknote]
  ];

  return (
    <div className="space-y-5">
      <Panel>
        <SectionHeading
          title="Admin overview"
          subtitle="Operational snapshot across VM capacity and subscription plans."
          action={
            <Button variant="secondary" onClick={() => void onRefresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, Icon]) => (
            <div key={label} className="rounded-lg border border-border bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <SectionHeading title="Recent VMs" subtitle="Latest machines returned by the backend." />
          {vms.length === 0 ? (
            <EmptyState title="No VMs found" body="Create a VM from the management view to start tracking capacity." />
          ) : (
            <div className="space-y-3">
              {vms.slice(0, 5).map((vm) => (
                <div key={vm.uuid} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{vm.name}</p>
                    <p className="text-xs text-muted-foreground">{vm.cores} cores / {vm.memory} GB</p>
                  </div>
                  <Badge tone={vm.aws_state ?? vm.status}>{vm.aws_state ?? vm.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel>
          <SectionHeading title="Plans" subtitle="Visibility and limits for the pricing catalog." />
          {plans.length === 0 ? (
            <EmptyState title="No plans found" body="Create a plan to make upload limits available to users." />
          ) : (
            <div className="space-y-3">
              {plans.slice(0, 5).map((plan) => (
                <div key={plan.uuid} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">${plan.price} / {plan.max_uploads_per_week} uploads weekly</p>
                  </div>
                  <Badge tone={plan.is_hidden ? "pending" : "success"}>{plan.is_hidden ? "Hidden" : "Visible"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function VmManagement({ token, vms, onChanged }: { token: string; vms: Vm[]; onChanged: () => Promise<void> }) {
  const [name, setName] = useState("vm10");
  const [cores, setCores] = useState(16);
  const [memory, setMemory] = useState(128);
  const [selectedUuid, setSelectedUuid] = useState("");
  const [message, setMessage] = useState("");

  const selectedVm = useMemo(() => vms.find((vm) => vm.uuid === selectedUuid) ?? vms[0], [selectedUuid, vms]);

  async function createVm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api.createVm(token, { name, cores, memory });
    setMessage("VM created.");
    await onChanged();
  }

  async function deleteVm(vmUuid: string) {
    await api.deleteVm(token, vmUuid);
    setMessage("VM deleted.");
    if (selectedUuid === vmUuid) setSelectedUuid("");
    await onChanged();
  }

  async function stopVm(vmUuid: string) {
    await api.stopVm(token, vmUuid);
    setMessage("VM stop requested.");
    await onChanged();
  }

  return (
    <div className="space-y-5">
      <Panel>
        <SectionHeading title="Create VM" subtitle="Provision a machine with the requested CPU and memory allocation." />
        <form className="grid gap-4 lg:grid-cols-[1fr_0.5fr_0.5fr_auto]" onSubmit={(event) => void createVm(event)}>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Cores
            <Input className="mt-2" type="number" min={1} value={cores} onChange={(event) => setCores(Number(event.target.value))} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Memory
            <Input className="mt-2" type="number" min={1} value={memory} onChange={(event) => setMemory(Number(event.target.value))} />
          </label>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </Panel>
      <Panel>
        <SectionHeading title="VMs" subtitle="List, inspect, stop, and delete cloud machines." action={<Button variant="secondary" onClick={() => void onChanged()}><RefreshCw className="h-4 w-4" />Refresh</Button>} />
        {vms.length === 0 ? (
          <EmptyState title="No VMs returned" body="Create a VM above to populate this table." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Resources</th>
                  <th className="py-3 pr-4">Cost</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">AWS</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vms.map((vm) => (
                  <tr key={vm.uuid} className="border-b border-border last:border-0">
                    <td className="max-w-[180px] truncate py-3 pr-4 font-semibold text-slate-900">{vm.name}</td>
                    <td className="py-3 pr-4">{vm.cores} cores / {vm.memory} GB</td>
                    <td className="py-3 pr-4">{vm.cost}</td>
                    <td className="py-3 pr-4"><Badge tone={vm.status}>{vm.status}</Badge></td>
                    <td className="py-3 pr-4"><Badge tone={vm.aws_state}>{vm.aws_state ?? "Unknown"}</Badge></td>
                    <td className="py-3 pr-4">{readableDate(vm.created_at)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => setSelectedUuid(vm.uuid)}>
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                        <Button variant="ghost" onClick={() => void stopVm(vm.uuid)}>
                          <Square className="h-4 w-4" />
                          Stop
                        </Button>
                        <Button variant="danger" onClick={() => void deleteVm(vm.uuid)}>
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
      {selectedVm ? <VmDetails token={token} vm={selectedVm} /> : null}
    </div>
  );
}

function VmDetails({ token, vm }: { token: string; vm: Vm }) {
  const [status, setStatus] = useState<VmStatus | null>(null);
  const [history, setHistory] = useState<VmHistory | null>(null);
  const [spentCost, setSpentCost] = useState<VmSpentCost | null>(null);
  const [error, setError] = useState("");

  const refreshDetails = useCallback(async () => {
    setError("");
    try {
      const [statusResponse, historyResponse, spentResponse] = await Promise.all([
        api.getVmStatus(token, vm.uuid),
        api.getVmHistory(token, vm.uuid),
        api.getVmSpentCost(token, vm.uuid)
      ]);
      setStatus(statusResponse.data);
      setHistory(historyResponse.data);
      setSpentCost(spentResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh VM details.");
    }
  }, [token, vm.uuid]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshDetails(), 0);
    const interval = window.setInterval(() => void refreshDetails(), 10000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [refreshDetails]);

  return (
    <Panel>
      <SectionHeading
        title={`VM details: ${vm.name}`}
        subtitle="Status, history, and spent cost refresh every 10 seconds while this VM is selected."
        action={
          <Button variant="secondary" onClick={() => void refreshDetails()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />
      {error ? <p className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Backend status" value={status?.status ?? vm.status} icon={Activity} tone={status?.status ?? vm.status} />
        <Metric label="AWS state" value={status?.aws_state ?? vm.aws_state ?? "Unknown"} icon={HardDrive} tone={status?.aws_state ?? vm.aws_state} />
        <Metric label="Spent" value={spentCost?.spent ?? "None"} icon={Banknote} />
        <Metric label="Resources" value={`${vm.cores} cores / ${vm.memory} GB`} icon={Cpu} />
      </div>
      <div className="mt-5 rounded-lg border border-border bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Latest history</h3>
        {history ? (
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <p><span className="text-muted-foreground">Batch:</span> {history.batch_uuid ?? "Not available"}</p>
            <p><span className="text-muted-foreground">Duration:</span> {formatDuration(history.run_duration)}</p>
            <p><span className="text-muted-foreground">Run cost:</span> {history.run_cost ?? "Not available"}</p>
            <p><span className="text-muted-foreground">Created:</span> {readableDate(history.created_at)}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No history returned yet.</p>
        )}
      </div>
    </Panel>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string | number | null; icon: LucideIcon; tone?: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <div className="mt-1">{tone ? <Badge tone={tone}>{value ?? "Not available"}</Badge> : <p className="text-lg font-bold text-slate-950">{value ?? "Not available"}</p>}</div>
    </div>
  );
}

function PlanManagement({ token, plans, onChanged }: { token: string; plans: Plan[]; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState(emptyPlanForm);
  const [editingUuid, setEditingUuid] = useState("");
  const [message, setMessage] = useState("");

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingUuid) {
      await api.updateAdminPlan(token, editingUuid, form);
      setMessage("Plan updated.");
    } else {
      await api.createAdminPlan(token, form);
      setMessage("Plan created.");
    }
    setEditingUuid("");
    setForm(emptyPlanForm);
    await onChanged();
  }

  async function togglePlan(plan: Plan) {
    await api.updateAdminPlan(token, plan.uuid, { is_hidden: !plan.is_hidden });
    setMessage(plan.is_hidden ? "Plan shown." : "Plan hidden.");
    await onChanged();
  }

  return (
    <div className="space-y-5">
      <Panel>
        <SectionHeading title={editingUuid ? "Edit plan" : "Create plan"} subtitle="Manage name, description, pricing, weekly limits, and visibility." />
        <form className="grid gap-4 xl:grid-cols-[1fr_1.2fr_0.45fr_0.65fr_auto]" onSubmit={(event) => void submitPlan(event)}>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <Input className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description
            <Input className="mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Price
            <Input className="mt-2" type="number" min={0} value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Weekly uploads
            <Input className="mt-2" type="number" min={0} value={form.max_uploads_per_week} onChange={(event) => setForm({ ...form, max_uploads_per_week: Number(event.target.value) })} />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" className="w-full">
              {editingUuid ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingUuid ? "Save" : "Create"}
            </Button>
          </div>
        </form>
        {editingUuid ? (
          <Button className="mt-3" variant="secondary" onClick={() => { setEditingUuid(""); setForm(emptyPlanForm); }}>
            Cancel edit
          </Button>
        ) : null}
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </Panel>
      <Panel>
        <SectionHeading title="Plans" subtitle="Create, edit, hide, and show subscription plans." />
        {plans.length === 0 ? (
          <EmptyState title="No plans returned" body="Create the first plan with the form above." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.uuid} className="rounded-lg border border-border bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-950">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <Badge tone={plan.is_hidden ? "pending" : "success"}>{plan.is_hidden ? "Hidden" : "Visible"}</Badge>
                </div>
                <p className="mt-5 text-3xl font-bold text-slate-950">${plan.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.max_uploads_per_week} uploads per week</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingUuid(plan.uuid);
                      setForm({
                        name: plan.name,
                        description: plan.description,
                        price: plan.price,
                        max_uploads_per_week: plan.max_uploads_per_week
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => void togglePlan(plan)}>
                    {plan.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {plan.is_hidden ? "Show" : "Hide"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function GaTesterPlaceholder() {
  return (
    <Panel>
      <SectionHeading title="GA tester" subtitle="Reserved for the later testing workflow requested in the admin brief." />
      <EmptyState title="Empty page" body="This section is intentionally available in navigation and ready for the next backend contract." />
    </Panel>
  );
}
