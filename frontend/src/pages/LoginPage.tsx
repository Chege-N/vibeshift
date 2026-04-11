import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/utils/api";
import { useAuthStore } from "@/hooks/useAuthStore";
import toast from "react-hot-toast";

const QUOTES = [
  { text: "I used to spend my entire Tuesday reformatting one podcast. Now it takes 60 seconds.", author: "Sarah M.", role: "Podcast creator" },
  { text: "The Twitter threads it generates actually outperform the ones I used to write myself.", author: "James K.", role: "Marketing consultant" },
  { text: "From posting once a week to every day across 6 platforms. Game changer.", author: "Priya L.", role: "Business coach" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.login(email, password);
      await fetchMe();
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[46%] bg-ink-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 30% 70%, #ff710a 0%, transparent 50%), radial-gradient(circle at 70% 20%, #7c3aed 0%, transparent 50%)" }} />

        <Link to="/" className="flex items-center gap-2.5 relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-white text-lg tracking-tight">
            Repurpose<span className="text-brand-400">AI</span>
          </span>
        </Link>

        <div className="relative">
          <div className="text-5xl mb-6">💬</div>
          <blockquote className="text-xl font-display font-semibold text-white leading-snug mb-5">
            "{quote.text}"
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
              {quote.author[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{quote.author}</p>
              <p className="text-xs text-ink-400">{quote.role}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 relative">
          {["📝","🐦","💼","📸","▶️"].map((e, i) => (
            <div key={i} className="w-9 h-9 rounded-xl bg-ink-800 flex items-center justify-center text-lg border border-ink-700">
              {e}
            </div>
          ))}
          <div className="w-9 h-9 rounded-xl bg-ink-800 flex items-center justify-center text-xs text-ink-400 border border-ink-700">+5</div>
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
            Welcome back
          </h1>
          <p className="text-ink-500 text-sm mb-8">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10" placeholder="you@example.com" required autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-11" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-60 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700 transition-colors">
              Sign up free →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
