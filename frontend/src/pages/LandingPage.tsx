import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Check, Zap, Clock,
  Share2, FileText, Mic, Video, Type, Globe,
} from "lucide-react";

const PLATFORMS = [
  { icon: "📝", name: "Blog Post" },
  { icon: "🐦", name: "Twitter Thread" },
  { icon: "💼", name: "LinkedIn" },
  { icon: "📸", name: "Instagram" },
  { icon: "▶️", name: "YouTube Desc" },
  { icon: "📧", name: "Newsletter" },
  { icon: "🎵", name: "TikTok Script" },
  { icon: "🤖", name: "Reddit Post" },
  { icon: "🎙️", name: "Podcast Notes" },
  { icon: "🎬", name: "Reel Script" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "One-click repurposing",
    desc: "Paste text, upload audio/video, or drop a URL. Get 10 platform-ready pieces in under 60 seconds.",
  },
  {
    icon: Share2,
    title: "Tone-aware adaptation",
    desc: "Claude preserves your voice while natively adapting format, length, and energy for each platform.",
  },
  {
    icon: FileText,
    title: "SEO-optimised output",
    desc: "Blog posts and YouTube descriptions include keywords, headers, and meta descriptions automatically.",
  },
  {
    icon: Clock,
    title: "Save 10+ hours weekly",
    desc: "Independent creators report saving an entire workday every week after switching to RepurposeAI.",
  },
];

const PRICING = [
  {
    plan: "Free",
    price: "$0",
    period: "forever",
    credits: "3 jobs / month",
    platforms: "3 platforms per job",
    features: ["Blog, Twitter, LinkedIn", "Text input", "Basic export"],
    cta: "Start free",
    href: "/register",
    highlight: false,
  },
  {
    plan: "Starter",
    price: "$19",
    period: "/ month",
    credits: "30 jobs / month",
    platforms: "All 10 platforms",
    features: ["All 10 platform formats", "Audio & video upload", "SEO scoring", "Priority queue"],
    cta: "Get Starter",
    href: "/register?plan=starter",
    highlight: false,
  },
  {
    plan: "Pro",
    price: "$49",
    period: "/ month",
    credits: "100 jobs / month",
    platforms: "All 10 platforms",
    features: ["Everything in Starter", "Custom tone presets", "Bulk processing", "API access"],
    cta: "Get Pro",
    href: "/register?plan=pro",
    highlight: true,
  },
  {
    plan: "Agency",
    price: "$149",
    period: "/ month",
    credits: "Unlimited jobs",
    platforms: "All 10 platforms",
    features: ["Everything in Pro", "5 team seats", "White-label exports", "Dedicated support"],
    cta: "Get Agency",
    href: "/register?plan=agency",
    highlight: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-ink-950 grain">
      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-ink-100 bg-[#fafaf7]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-ink-950">
              Repurpose<span className="text-brand-500">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Log in</Link>
            <Link to="/register" className="btn-primary text-sm">
              Start free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-brand-700 text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Claude AI
            </div>

            <h1 className="font-display text-[3.5rem] leading-[1.05] font-extrabold text-ink-950 mb-6 tracking-tight">
              Turn 1 piece of content<br />
              into <span className="text-brand-500">10 platform-ready</span> pieces
            </h1>

            <p className="text-xl text-ink-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Independent creators, podcasters, and marketers waste 10+ hours weekly
              reformatting content. RepurposeAI does it in 60 seconds — with the right
              tone, length, and format for every channel.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="btn-primary text-base px-7 py-3.5">
                Start for free — no card needed
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-outline text-base px-7 py-3.5">
                View demo
              </Link>
            </div>

            <p className="mt-4 text-sm text-ink-400">
              3 free jobs/month · No credit card · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Platform strip ───────────────────────────── */}
      <section className="py-12 border-y border-ink-100 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-ink-400 uppercase tracking-widest mb-8">
            1 input → 10 native formats
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {PLATFORMS.map((p, i) => (
              <motion.div
                key={p.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-2 border border-ink-100"
              >
                <span className="text-2xl">{p.icon}</span>
                <span className="text-[10px] font-medium text-ink-600 text-center leading-tight">
                  {p.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-ink-950 mb-4">
              Three steps. Zero wasted hours.
            </h2>
            <p className="text-ink-500 text-lg max-w-xl mx-auto">
              Drop in your content, choose your platforms, and download everything ready to publish.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Type,
                title: "Input your content",
                desc: "Paste text, upload an MP3/MP4 file, or drop a YouTube URL. We handle transcription automatically.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "AI adapts for each platform",
                desc: "Claude reads your content, understands the intent, and generates native-feeling output for every channel you selected.",
              },
              {
                step: "03",
                icon: Share2,
                title: "Copy, download & publish",
                desc: "Each piece is ready to paste directly into your platform. No editing required — but every output is editable.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="card p-7 relative"
              >
                <span className="absolute top-6 right-6 font-display text-5xl font-extrabold text-ink-100">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{item.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="py-20 px-6 bg-ink-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Built for serious creators
            </h2>
            <p className="text-ink-400 text-lg max-w-xl mx-auto">
              Not just a template tool. RepurposeAI understands context, adapts tone, and preserves your original intent.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex gap-4 p-6 rounded-xl bg-ink-900 border border-ink-800"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-ink-400 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-ink-950 mb-4">Simple pricing</h2>
            <p className="text-ink-500 text-lg">Start free, upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {PRICING.map((p, i) => (
              <motion.div
                key={p.plan}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className={`card p-7 flex flex-col ${p.highlight ? "ring-2 ring-brand-500 relative" : ""}`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-sm font-medium text-ink-500 mb-1">{p.plan}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-extrabold text-ink-950">{p.price}</span>
                    <span className="text-ink-400 text-sm">{p.period}</span>
                  </div>
                  <p className="text-xs text-ink-400 mt-2">{p.credits} · {p.platforms}</p>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                      <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.href}
                  className={p.highlight ? "btn-primary w-full justify-center" : "btn-outline w-full justify-center"}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-brand-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Stop reformatting. Start creating.
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            Join thousands of creators who reclaimed their week with RepurposeAI.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors">
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-ink-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm text-ink-900">
              Repurpose<span className="text-brand-500">AI</span>
            </span>
          </div>
          <p className="text-sm text-ink-400">© {new Date().getFullYear()} RepurposeAI. All rights reserved.</p>
          <div className="flex gap-5 text-sm text-ink-400">
            <a href="#" className="hover:text-ink-700">Privacy</a>
            <a href="#" className="hover:text-ink-700">Terms</a>
            <a href="#" className="hover:text-ink-700">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
