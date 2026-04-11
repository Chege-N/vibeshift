import { motion } from "framer-motion";
import { Check, Loader2, Sparkles, Zap, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { useCheckout } from "@/hooks/useQueries";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Link, useNavigate } from "react-router-dom";

const PLANS = [
  {
    id: "free", name: "Free", price: "$0", period: "forever",
    credits: "3 jobs / month", platforms: "3 platforms per job",
    features: ["Blog, Twitter & LinkedIn", "Text input only", "Standard queue", "Copy & download"],
    cta: "Current plan", highlight: false, popular: false,
  },
  {
    id: "starter", name: "Starter", price: "$19", period: "/ month",
    credits: "30 jobs / month", platforms: "All 10 platforms",
    features: ["All 10 platform outputs", "Audio & video upload", "AI transcription included", "Priority queue", "SEO scoring"],
    cta: "Get Starter", highlight: false, popular: false,
  },
  {
    id: "pro", name: "Pro", price: "$49", period: "/ month",
    credits: "100 jobs / month", platforms: "All 10 platforms",
    features: ["Everything in Starter", "Custom tone presets", "Target audience setting", "Keyword injection", "API access (soon)"],
    cta: "Get Pro", highlight: true, popular: true,
  },
  {
    id: "agency", name: "Agency", price: "$149", period: "/ month",
    credits: "Unlimited jobs", platforms: "All 10 platforms",
    features: ["Everything in Pro", "5 team member seats", "White-label exported files", "Dedicated Slack support", "Custom integrations"],
    cta: "Get Agency", highlight: false, popular: false,
  },
];

const FAQ = [
  { q: "What counts as a job?", a: "One job = one piece of content repurposed. Each job can produce up to 10 platform-ready outputs simultaneously." },
  { q: "Can I upgrade or downgrade anytime?", a: "Yes — you can change your plan at any time. Changes take effect at the start of your next billing cycle." },
  { q: "What happens when I run out of credits?", a: "Jobs will be paused until your credits reset (every 30 days) or you upgrade your plan." },
  { q: "Do unused credits roll over?", a: "Credits reset every 30 days and don't roll over. Upgrade to a higher plan if you consistently need more." },
  { q: "Is there a free trial for paid plans?", a: "The Free plan gives you 3 jobs/month permanently. Paid plans are available with no trial period — upgrade when ready." },
];

interface PricingPageProps { embedded?: boolean; }

export default function PricingPage({ embedded = false }: PricingPageProps) {
  const { user } = useAuthStore();
  const checkout = useCheckout();
  const navigate = useNavigate();
  const currentPlan = user?.plan || "free";

  const handleUpgrade = (planId: string) => {
    if (!user) { navigate("/register?plan=" + planId); return; }
    checkout.mutate(planId);
  };

  return (
    <div className={clsx("py-16 px-6", !embedded && "min-h-screen bg-surface")}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          {!embedded && (
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-brand-700 text-sm font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Simple, transparent pricing
            </div>
          )}
          <h1 className={clsx("font-display font-extrabold text-ink-950 tracking-tight mb-3",
            embedded ? "text-2xl" : "text-4xl"
          )}>
            {embedded ? "Choose your plan" : "Pricing for every creator"}
          </h1>
          <p className="text-ink-500 max-w-md mx-auto text-lg">
            Start free. Upgrade when you need more reach.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {PLANS.map((plan, i) => {
            const isCurrent = currentPlan === plan.id;
            const isLoading = checkout.isPending && checkout.variables === plan.id;
            const isPaid = plan.id !== "free";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                  "card flex flex-col p-6 relative transition-all",
                  plan.highlight && "ring-2 ring-brand-500 shadow-lg shadow-brand-100/50",
                  isCurrent && "ring-2 ring-emerald-400"
                )}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                    Most popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    ✓ Current plan
                  </div>
                )}

                {/* Plan name & price */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-extrabold text-ink-950">{plan.price}</span>
                    <span className="text-ink-400 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-xs text-ink-500 mt-2">{plan.credits}</p>
                  <p className="text-xs text-ink-400">{plan.platforms}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                      <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                    ✓ Current plan
                  </div>
                ) : plan.id === "free" ? (
                  <Link to="/register" className="w-full py-2.5 text-center text-sm font-bold text-ink-500 border-2 border-ink-100 rounded-xl hover:border-ink-300 transition-colors block">
                    Get started free
                  </Link>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading}
                    className={clsx(
                      "w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60",
                      plan.highlight
                        ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-200"
                        : "bg-ink-950 text-white hover:bg-ink-800"
                    )}
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Zap className="w-4 h-4" /> {plan.cta}</>
                    }
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        {!embedded && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-extrabold text-ink-950 text-center mb-8 tracking-tight">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <motion.div
                  key={item.q}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5"
                >
                  <p className="font-bold text-ink-900 text-sm mb-1.5">{item.q}</p>
                  <p className="text-sm text-ink-500 leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-ink-400">
              All plans billed monthly · Cancel anytime · Secure payments via Stripe ·{" "}
              <a href="mailto:hello@repurposeai.com" className="text-brand-500 hover:underline">Questions? Contact us</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
