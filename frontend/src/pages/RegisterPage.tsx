import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { authApi } from "@/utils/api";
import { useAuthStore } from "@/hooks/useAuthStore";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const PERKS = [
  "3 free repurposing jobs every month",
  "Blog post, Twitter thread & LinkedIn output",
  "Copy, download and publish instantly",
  "No credit card required",
];

function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const labels = ["", "Weak", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-emerald-500"];
  if (!password) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex-1 flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={clsx("h-1 flex-1 rounded-full transition-all", i <= strength ? colors[strength] : "bg-ink-100")} />
        ))}
      </div>
      <span className={clsx("text-xs font-semibold", strength === 1 ? "text-red-500" : strength === 2 ? "text-amber-600" : "text-emerald-600")}>
        {labels[strength]}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await authApi.register(email, password, fullName);
      await authApi.login(email, password);
      await fetchMe();
      toast.success("Account created! Welcome 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[46%] bg-gradient-to-br from-brand-500 to-brand-700 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.06) 0%, transparent 40%)" }} />

        <Link to="/" className="flex items-center gap-2.5 relative">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-white text-lg tracking-tight">RepurposeAI</span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-3xl font-extrabold text-white leading-tight mb-7">
            Stop reformatting.<br />Start creating.
          </h2>
          <ul className="space-y-3.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-brand-50">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 relative">
          <p className="text-sm text-brand-100 leading-relaxed italic">
            "I went from posting once a week to every single day across 6 platforms. It took me less than an hour to set up."
          </p>
          <p className="text-xs text-brand-200 mt-3 font-semibold">— Priya L., Business Coach</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-extrabold text-ink-950 tracking-tight">
              Repurpose<span className="gradient-text">AI</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-extrabold text-ink-950 mb-1.5 tracking-tight">
            Create your account
          </h1>
          <p className="text-ink-500 text-sm mb-8">Start repurposing content in seconds — free forever.</p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input pl-10"
                  placeholder="Full name"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-11"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-60 mt-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Create account</span> <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-400">
            By signing up you agree to our{" "}
            <Link to="/legal/terms" className="underline hover:text-ink-700">Terms</Link>
            {" "}and{" "}
            <Link to="/legal/privacy" className="underline hover:text-ink-700">Privacy Policy</Link>.
          </p>
          <p className="mt-4 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700 transition-colors">
              Sign in →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
