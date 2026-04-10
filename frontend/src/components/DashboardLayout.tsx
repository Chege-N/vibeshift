import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Plus, Settings, CreditCard,
  LogOut, Zap, ChevronRight, Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMe } from "@/hooks/useQueries";
import { clsx } from "clsx";

const NAV = [
  { to: "/dashboard",          icon: LayoutDashboard, label: "Dashboard",    end: true },
  { to: "/dashboard/new",      icon: Plus,            label: "New Job"             },
  { to: "/dashboard/pricing",  icon: CreditCard,      label: "Upgrade"             },
  { to: "/dashboard/settings", icon: Settings,        label: "Settings"            },
];

const PLAN_BADGE: Record<string, string> = {
  free:    "bg-ink-100 text-ink-600",
  starter: "bg-amber-100 text-amber-700",
  pro:     "bg-brand-100 text-brand-700",
  agency:  "bg-purple-100 text-purple-700",
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const liveUser = me || user;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const creditPct = liveUser
    ? Math.min(100, (liveUser.credits_used / liveUser.monthly_credit_limit) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-ink-100 sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-800 text-ink-950 text-lg tracking-tight">
              Repurpose<span className="text-brand-500">AI</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-50 text-brand-600"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Credits bar */}
        {liveUser && (
          <div className="p-4 border-t border-ink-100">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-ink-500 font-medium">Credits</span>
              <span className={clsx("badge text-xs", PLAN_BADGE[liveUser.plan])}>
                {liveUser.plan}
              </span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mb-1.5">
              <motion.div
                className="h-full bg-brand-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${creditPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-ink-500">
              <span className="font-semibold text-ink-800">{liveUser.credits_remaining}</span>
              {" "}of {liveUser.monthly_credit_limit} remaining
            </p>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-ink-100">
          <div className="flex items-center gap-2.5 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
              {liveUser?.full_name?.[0]?.toUpperCase() || liveUser?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink-900 truncate">
                {liveUser?.full_name || "Creator"}
              </p>
              <p className="text-xs text-ink-500 truncate">{liveUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
