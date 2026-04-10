import { motion } from "framer-motion";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { clsx } from "clsx";
import { useCheckout } from "@/hooks/useQueries";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Link } from "react-router-dom";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "3 jobs / month",
    platforms: "3 platforms per job",
    features: [
      "Blog, Twitter & LinkedIn",
      "Text input only",
      "Standard queue",
      "Basic export (copy/download)",
    ],
    cta: "Current plan",
    disabledFor: "free",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/ month",
    credits: "30 jobs / month",
    platforms: "All 10 platforms",
    features: [
      "All 10 platform outputs",
      "Audio & video upload",
      "Transcription included",
      "Priority processing queue",
      "SEO scoring per output",
    ],
    cta: "Upgrade to Starter",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/ month",
    credits: "100 jobs / month",
    platforms: "All 10 platforms",
    features: [
      "Everything in Starter",
      "Custom tone presets",
      "Target audience setting",
      "Keyword injection for SEO",
      "API access (coming soon)",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "$149",
    period: "/ month",
    credits: "Unlimited jobs",
    platforms: "All 10 platforms",
    features: [
      "Everything in Pro",
      "5 team member seats",
      "White-label exported files",
      "Dedicated Slack support",
      "Custom integrations",
    ],
    cta: "Upgrade to Agency",
    highlight: false,
  },
];

interface PricingPageProps {
  embedded?: boolean;
}

export default function PricingPage({ embedded = false }: PricingPageProps) {
  const { user } = useAuthStore();
  const checkout = useCheckout();
  const currentPlan = user?.plan || "free";

  const handleUpgrade = (planId: string) => {
    if (!user) {
      window.location.href = "/register?plan=" + planId;
      return;
    }
    checkout.mutate(planId);
  };

  return (
    <div className={clsx("py-12 px-6", embedded ? "max-w-5xl mx-auto" : "min-h-screen bg-surface")}>
      {/* Header */}
      <div className="text-center mb-12">
        {!embedded && (
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-brand-700 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
        )}
        <h1 className={clsx("font-display font-bold text-ink-950 mb-3", embedded ? "text-2xl" : "text-4xl")}>
          {embedded ? "Upgrade your plan" : "Pricing for every creator"}
        </h1>
        <p className="text-ink-500 max-w-lg mx-auto">
          Start free, upgrade when you need more. All paid plans include all 10 platform formats and priority processing.
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {PLANS.map((plan, i) => {
          const isCurrent = currentPlan === plan.id;
          const isLoading = checkout.isPending && checkout.variables === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={clsx(
                "card flex flex-col p-6 relative",
                plan.highlight && "ring-2 ring-brand-500"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Most popular
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Current plan
                </div>
              )}

              <div className="mb-5">
                <p className="text-sm font-semibold text-ink-500 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-ink-950">{plan.price}</span>
                  <span className="text-ink-400 text-sm">{plan.period}</span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-ink-500">{plan.credits}</p>
                  <p className="text-xs text-ink-500">{plan.platforms}</p>
                </div>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                    <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 text-center text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
                  ✓ Current plan
                </div>
              ) : plan.id === "free" ? (
                <div className="w-full py-2.5 text-center text-sm text-ink-400 border border-ink-100 rounded-lg">
                  Free forever
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading || isCurrent}
                  className={clsx(
                    "w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                    plan.highlight
                      ? "bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                      : "bg-ink-950 text-white hover:bg-ink-800 disabled:opacity-60"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Zap className="w-4 h-4" /> {plan.cta}</>
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* FAQ / reassurance */}
      <div className="mt-14 max-w-2xl mx-auto text-center text-sm text-ink-400">
        <p>
          All plans billed monthly · Cancel anytime · Secure payments via Stripe ·
          Credits reset every 30 days · Questions?{" "}
          <a href="mailto:hello@repurposeai.com" className="text-brand-500 hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
