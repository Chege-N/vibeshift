import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, BarChart2, Briefcase, DollarSign,
  Loader2, Shield, RefreshCw, TrendingUp,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || "";

interface PlatformStats {
  total_users: number;
  active_users_30d: number;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_outputs: number;
  free_users: number;
  starter_users: number;
  pro_users: number;
  agency_users: number;
  jobs_today: number;
  revenue_estimate_usd: number;
}

interface AdminJob {
  id: number;
  user_id: number;
  title: string;
  status: string;
  content_type: string;
  platforms: string[];
  created_at: string;
  processing_time_seconds: number | null;
}

const STATUS_COLOR: Record<string, string> = {
  completed:    "text-emerald-700 bg-emerald-50 border-emerald-200",
  failed:       "text-red-700 bg-red-50 border-red-200",
  processing:   "text-purple-700 bg-purple-50 border-purple-200",
  pending:      "text-amber-700 bg-amber-50 border-amber-200",
  transcribing: "text-blue-700 bg-blue-50 border-blue-200",
};

export default function AdminPage() {
  const [secret, setSecret]   = useState(ADMIN_SECRET);
  const [authed, setAuthed]   = useState(false);
  const [stats, setStats]     = useState<PlatformStats | null>(null);
  const [jobs, setJobs]       = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState<"stats" | "jobs">("stats");

  const headers = { "x-admin-secret": secret };

  const load = async () => {
    if (!secret.trim()) { toast.error("Enter admin secret"); return; }
    setLoading(true);
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get("/admin/stats", { headers }),
        api.get("/admin/jobs?limit=50", { headers }),
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data);
      setAuthed(true);
      toast.success("Admin dashboard loaded");
    } catch (e: any) {
      if (e?.response?.status === 403) {
        toast.error("Invalid admin secret");
      } else {
        toast.error("Failed to load admin data");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Login screen ──────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ink-950 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-ink-950">Admin Portal</h1>
            <p className="text-xs text-ink-500">RepurposeAI internal dashboard</p>
          </div>
        </div>
        <label className="block text-sm font-semibold text-ink-700 mb-1.5">Admin secret key</label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="input mb-4"
          placeholder="Your SECRET_KEY from .env"
          autoFocus
        />
        <button onClick={load} disabled={loading} className="btn-secondary w-full py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Access admin portal
        </button>
        <p className="text-xs text-ink-400 mt-3 text-center">
          Use the SECRET_KEY value from your .env file
        </p>
      </motion.div>
    </div>
  );

  // ── Dashboard ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ink-950 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-ink-950 text-xl">Admin Portal</h1>
              <p className="text-xs text-ink-500">Platform overview</p>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="btn-ghost text-sm gap-1.5">
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-ink-100 rounded-xl mb-6 w-fit">
          {(["stats", "jobs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
                tab === t ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Stats tab */}
        {tab === "stats" && stats && (
          <div className="space-y-6">
            {/* Revenue */}
            <div className="card p-6 bg-ink-950 text-white">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-semibold text-ink-400">Estimated MRR</span>
              </div>
              <p className="font-display text-4xl font-extrabold">
                ${stats.revenue_estimate_usd.toLocaleString()}
                <span className="text-xl text-ink-500 ml-2 font-normal">/month</span>
              </p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total users",      value: stats.total_users,       icon: Users,       color: "text-blue-500 bg-blue-50"      },
                { label: "Active (30d)",     value: stats.active_users_30d,  icon: TrendingUp,  color: "text-emerald-500 bg-emerald-50" },
                { label: "Total jobs",       value: stats.total_jobs,        icon: Briefcase,   color: "text-purple-500 bg-purple-50"  },
                { label: "Jobs today",       value: stats.jobs_today,        icon: BarChart2,   color: "text-brand-500 bg-brand-50"    },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card p-5">
                  <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center mb-3", color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-ink-500 mb-1">{label}</p>
                  <p className="font-display text-2xl font-extrabold text-ink-950">{value}</p>
                </div>
              ))}
            </div>

            {/* Plan distribution */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-ink-900 mb-5">Plan distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { plan: "Free",    count: stats.free_users,    color: "bg-ink-100 text-ink-600"      },
                  { plan: "Starter", count: stats.starter_users, color: "bg-amber-50 text-amber-700"   },
                  { plan: "Pro",     count: stats.pro_users,     color: "bg-brand-50 text-brand-700"   },
                  { plan: "Agency",  count: stats.agency_users,  color: "bg-purple-50 text-purple-700" },
                ].map(({ plan, count, color }) => (
                  <div key={plan} className={clsx("p-4 rounded-xl border text-center", color)}>
                    <p className="text-2xl font-extrabold font-display">{count}</p>
                    <p className="text-xs font-bold mt-1">{plan}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Job success rate */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-ink-900 mb-4">Job success rate</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-ink-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 rounded-l-full"
                    style={{ width: `${stats.total_jobs ? (stats.completed_jobs / stats.total_jobs) * 100 : 0}%` }} />
                  <div className="h-full bg-red-400"
                    style={{ width: `${stats.total_jobs ? (stats.failed_jobs / stats.total_jobs) * 100 : 0}%` }} />
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {stats.completed_jobs} completed
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600">
                    <XCircle className="w-3.5 h-3.5" /> {stats.failed_jobs} failed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs tab */}
        {tab === "jobs" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <h2 className="font-display font-bold text-ink-900">All jobs ({jobs.length})</h2>
            </div>
            <div className="divide-y divide-ink-50">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">
                      {job.title || `Job #${job.id}`}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      User #{job.user_id} · {job.content_type} · {job.platforms.length} platforms
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.processing_time_seconds && (
                      <span className="text-xs text-ink-400">{job.processing_time_seconds.toFixed(1)}s</span>
                    )}
                    <span className={clsx("badge text-[11px]", STATUS_COLOR[job.status] || "bg-ink-50 text-ink-600 border-ink-200")}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="py-12 text-center text-ink-400 text-sm">No jobs found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
