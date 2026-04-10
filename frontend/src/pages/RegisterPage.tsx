import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Check } from "lucide-react";
import { authApi } from "@/utils/api";
import { useAuthStore } from "@/hooks/useAuthStore";
import toast from "react-hot-toast";

const PERKS = [
  "3 free jobs every month",
  "Blog, Twitter & LinkedIn outputs",
  "No credit card required",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register(email, password, fullName);
      await authApi.login(email, password);
      await fetchMe();
      toast.success("Account created! Welcome to RepurposeAI 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left */}
      <div className="hidden lg:flex w-1/2 bg-brand-500 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-white">RepurposeAI</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold text-white mb-6 leading-snug">
            Stop reformatting.<br />Start creating.
          </h2>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-brand-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-brand-200 text-sm">© {new Date().getFullYear()} RepurposeAI</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <h1 className="font-display text-3xl font-bold text-ink-950 mb-2">Create your account</h1>
          <p className="text-ink-500 mb-8">Start repurposing content in seconds — free forever.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input pl-10"
                  placeholder="Alex Johnson"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-400">
            By signing up, you agree to our{" "}
            <a href="#" className="underline hover:text-ink-700">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="underline hover:text-ink-700">Privacy Policy</a>.
          </p>
          <p className="mt-3 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
