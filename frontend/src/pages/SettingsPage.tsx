import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, CreditCard, LogOut, Loader2, Save, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMe } from "@/hooks/useQueries";
import { userApi } from "@/utils/api";
import { useBillingPortal } from "@/hooks/useQueries";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";

const PLAN_BADGES: Record<string, string> = {
  free: "bg-ink-100 text-ink-600",
  starter: "bg-amber-100 text-amber-700",
  pro: "bg-brand-100 text-brand-700",
  agency: "bg-purple-100 text-purple-700",
};

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const { data: user, isLoading } = useMe();
  const portal = useBillingPortal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await userApi.update({ full_name: fullName });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-950 mb-1">Settings</h1>
        <p className="text-ink-500 text-sm">Manage your profile, plan, and account.</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-ink-500" />
            <h2 className="font-display font-bold text-ink-900">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="input pl-10 bg-ink-50 text-ink-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-ink-400 mt-1">Email cannot be changed.</p>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </motion.div>

        {/* Plan & billing */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-4 h-4 text-ink-500" />
            <h2 className="font-display font-bold text-ink-900">Plan & Billing</h2>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-ink-50 border border-ink-100 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-ink-900 capitalize">{user?.plan} plan</span>
                <span className={clsx("badge text-xs capitalize", PLAN_BADGES[user?.plan || "free"])}>
                  {user?.plan}
                </span>
              </div>
              <p className="text-xs text-ink-500">
                {user?.credits_remaining} of {user?.monthly_credit_limit} credits remaining this month
              </p>
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
        </motion.div>

        {/* Credits info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <h2 className="font-display font-bold text-ink-900 mb-3">Credit usage</h2>
          <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((user?.credits_used || 0) / (user?.monthly_credit_limit || 1)) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-ink-500">
            <span>{user?.credits_used || 0} used</span>
            <span>{user?.credits_remaining || 0} remaining</span>
          </div>
          <p className="text-xs text-ink-400 mt-2">Credits reset every 30 days from your signup date.</p>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 border-red-100">
          <h2 className="font-display font-bold text-ink-900 mb-4">Account</h2>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out of RepurposeAI
          </button>
        </motion.div>
      </div>
    </div>
  );
}
