import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Plus, Settings, CreditCard,
  LogOut, Sparkles, Zap, TrendingUp, ChevronUp, Shield, Moon, Sun,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTheme } from "@/hooks/useTheme";
import { useMe } from "@/hooks/useQueries";
import { clsx } from "clsx";

const NAV = [
  { to: "/dashboard",          icon: LayoutDashboard, label: "Dashboard", end: true  },
  { to: "/dashboard/new",      icon: Plus,            label: "New Job",   end: false },
  { to: "/dashboard/pricing",  icon: TrendingUp,      label: "Upgrade",   end: false },
  { to: "/dashboard/settings", icon: Settings,        label: "Settings",  end: false },
];

const PLAN_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  free:    { label: "Free",    color: "text-ink-500 bg-ink-100",          bar: "bg-ink-400"    },
  starter: { label: "Starter", color: "text-amber-700 bg-amber-100",      bar: "bg-amber-500"  },
  pro:     { label: "Pro",     color: "text-brand-700 bg-brand-100",      bar: "bg-brand-500"  },
  agency:  { label: "Agency",  color: "text-purple-700 bg-purple-100",    bar: "bg-purple-500" },
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const liveUser = me || user;

  const plan = PLAN_CONFIG[liveUser?.plan || "free"];
  const creditPct = liveUser
    ? Math.min(100, (liveUser.credits_used / liveUser.monthly_credit_limit) * 100)
    : 0;
  const initials =
    liveUser?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ||
    liveUser?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="w-[240px] shrink-0 flex flex-col bg-white border-r border-ink-100/80 sticky top-0 h-screen overflow-hidden">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-ink-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-200">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-extrabold text-[17px] tracking-tight text-ink-950">
              Repurpose<span className="gradient-text">AI</span>
            </span>
          </div>
        </div>

        {/* New job CTA */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => navigate("/dashboard/new")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl
                       bg-brand-500 text-white text-sm font-semibold
                       hover:bg-brand-600 transition-all shadow-sm shadow-brand-200
                       active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            New job
            <span className="ml-auto text-brand-200 text-xs font-normal">⌘K</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV.filter(n => n.label !== "New Job").map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                  isActive
                    ? "nav-active font-semibold"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Credits */}
        {liveUser && (
          <div className="mx-3 mb-3 p-3.5 rounded-xl bg-surface border border-ink-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-ink-600">Credits this month</span>
              <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", plan.color)}>
                {plan.label}
              </span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mb-2">
              <motion.div
                className={clsx("h-full rounded-full", plan.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${creditPct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-ink-400">
                <span className="font-bold text-ink-700">{liveUser.credits_remaining}</span> left
              </span>
              <span className="text-xs text-ink-400">{liveUser.monthly_credit_limit} total</span>
            </div>
            {liveUser.plan === "free" && (
              <button
                onClick={() => navigate("/dashboard/pricing")}
                className="mt-2.5 w-full text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Upgrade for more
              </button>
            )}
          </div>
        )}

        {/* User */}
        <div className="px-3 pb-3 border-t border-ink-100/80 pt-3">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-ink-50 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-900 truncate leading-tight">
                {liveUser?.full_name || "Creator"}
              </p>
              <p className="text-[11px] text-ink-400 truncate">{liveUser?.email}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-ink-300 hover:text-ink-700 hover:bg-ink-100 transition-colors opacity-0 group-hover:opacity-100"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="p-1.5 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
