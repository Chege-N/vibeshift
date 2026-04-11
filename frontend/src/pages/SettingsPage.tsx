import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, CreditCard, LogOut, Loader2, Save, ExternalLink, Eye, EyeOff, Check } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMe } from "@/hooks/useQueries";
import { userApi, api } from "@/utils/api";
import { useBillingPortal } from "@/hooks/useQueries";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";

const PLAN_BADGE: Record<string, string> = {
  free:    "bg-ink-100 text-ink-600 border-ink-200",
  starter: "bg-amber-50 text-amber-700 border-amber-200",
  pro:     "bg-brand-50 text-brand-700 border-brand-200",
  agency:  "bg-purple-50 text-purple-700 border-purple-200",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <h2 className="font-display font-bold text-ink-900 mb-5 text-[15px]">{title}</h2>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const { data: user, isLoading } = useMe();
  const portal = useBillingPortal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await userApi.update({ full_name: fullName });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setSaved(true);
      toast.success("Profile updated!");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPwd.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setChangingPwd(true);
    try {
      await api.post("/users/me/change-password", {
        current_password: currentPwd,
        new_password: newPwd,
      });
      toast.success("Password updated!");
      setCurrentPwd(""); setNewPwd("");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Password change failed");
    } finally {
      setChangingPwd(false);
    }
  };

  if (isLoading) return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
    </div>
  );

  const creditPct = user ? Math.min(100, (user.credits_used / user.monthly_credit_limit) * 100) : 0;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-ink-950 tracking-tight">Settings</h1>
        <p className="text-ink-500 text-sm mt-1">Manage your account, security, and billing.</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <Section title="Profile">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input pl-10"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="input pl-10 bg-surface text-ink-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-ink-400 mt-1.5">Email cannot be changed.</p>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </Section>

        {/* Password */}
        <Section title="Change password">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Current password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPwd.length > 0 && (
                <div className="mt-2 h-1 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className={clsx("h-full rounded-full transition-all", newPwd.length < 8 ? "bg-red-400 w-1/3" : newPwd.length < 12 ? "bg-amber-400 w-2/3" : "bg-emerald-500 w-full")}
                  />
                </div>
              )}
            </div>
            <button
              onClick={changePassword}
              disabled={changingPwd || !currentPwd || !newPwd}
              className="btn-secondary disabled:opacity-50"
            >
              {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update password
            </button>
          </div>
        </Section>

        {/* Billing */}
        <Section title="Plan & Billing">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-ink-100 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-ink-900 capitalize">{user?.plan} plan</span>
                <span className={clsx("badge text-xs capitalize", PLAN_BADGE[user?.plan || "free"])}>
                  {user?.plan}
                </span>
              </div>
              <p className="text-xs text-ink-500">
                {user?.credits_remaining} of {user?.monthly_credit_limit} credits left this month
              </p>
              <div className="mt-2 h-1.5 w-48 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${creditPct}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/pricing")}
              className="btn-outline text-xs"
            >
              {user?.plan === "free" ? "Upgrade" : "Change plan"}
            </button>
          </div>
          {user?.plan !== "free" && user?.stripe_customer_id && (
            <button
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
              className="btn-ghost text-sm"
            >
              {portal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage billing on Stripe
            </button>
          )}
        </Section>

        {/* Danger */}
        <Section title="Account">
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out of RepurposeAI
          </button>
        </Section>
      </div>
    </div>
  );
}
