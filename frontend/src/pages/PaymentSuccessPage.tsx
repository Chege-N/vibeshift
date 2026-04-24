import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { billingApi } from "@/utils/api";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found. Contact support if you were charged.");
      return;
    }

    const verify = async () => {
      try {
        const result = await billingApi.verify(reference);
        setPlan(result.plan);
        setMessage(result.message);
        setStatus("success");

        // Refresh user data so the UI shows the new plan immediately
        await fetchMe();
        queryClient.invalidateQueries({ queryKey: ["me"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => navigate("/dashboard"), 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err?.response?.data?.detail ||
          "Could not verify payment. If you were charged, contact support."
        );
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-10 max-w-md w-full text-center"
      >
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink-950 mb-2">
              Confirming your payment…
            </h1>
            <p className="text-ink-500 text-sm">This takes just a second.</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </motion.div>
            <h1 className="font-display text-2xl font-extrabold text-ink-950 mb-2 tracking-tight">
              You're on {plan.charAt(0).toUpperCase() + plan.slice(1)}! 🎉
            </h1>
            <p className="text-ink-500 text-sm mb-6">{message}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Redirecting to dashboard…
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink-950 mb-2">
              Verification failed
            </h1>
            <p className="text-ink-500 text-sm mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-outline text-sm"
              >
                Go to dashboard
              </button>
              <a
                href="mailto:support@repurposeai.com"
                className="btn-primary text-sm"
              >
                Contact support
              </a>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
