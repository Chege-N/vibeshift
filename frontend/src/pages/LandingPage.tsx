import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Check, Zap, Clock, Share2, FileText,
} from "lucide-react";

const PLATFORMS = [
  { icon: "📝", name: "Blog Post",       color: "bg-blue-50 border-blue-100 text-blue-700"     },
  { icon: "🐦", name: "X Thread",        color: "bg-sky-50 border-sky-100 text-sky-700"        },
  { icon: "💼", name: "LinkedIn",        color: "bg-indigo-50 border-indigo-100 text-indigo-700"},
  { icon: "📸", name: "Instagram",       color: "bg-pink-50 border-pink-100 text-pink-700"     },
  { icon: "▶️", name: "YouTube Desc",    color: "bg-red-50 border-red-100 text-red-700"        },
  { icon: "📧", name: "Newsletter",      color: "bg-amber-50 border-amber-100 text-amber-700"  },
  { icon: "🎵", name: "TikTok Script",   color: "bg-slate-50 border-slate-100 text-slate-700"  },
  { icon: "🤖", name: "Reddit Post",     color: "bg-orange-50 border-orange-100 text-orange-700"},
  { icon: "🎙️", name: "Podcast Notes",  color: "bg-purple-50 border-purple-100 text-purple-700"},
  { icon: "🎬", name: "Reel Script",     color: "bg-emerald-50 border-emerald-100 text-emerald-700"},
];

const FEATURES = [
  { icon: Zap,      title: "One-click, 10 outputs",    desc: "Paste text, drop a URL, or upload audio/video. Claude generates 10 platform-native pieces in under 60 seconds." },
  { icon: Share2,   title: "Tone-aware adaptation",    desc: "Your voice stays intact. Claude adapts format, energy, and length natively for each channel." },
  { icon: FileText, title: "SEO built-in",             desc: "Blog posts and YouTube descriptions get keywords, H2 headers, and meta descriptions automatically." },
  { icon: Clock,    title: "Save 10+ hours a week",    desc: "Creators report reclaiming an entire workday every week. That's time back in your life." },
];

const TESTIMONIALS = [
  { quote: "I used to spend my entire Tuesday reformatting one podcast episode. Now it takes 60 seconds.", name: "Sarah M.", role: "Podcast creator, 50k subscribers" },
  { quote: "The Twitter threads it generates actually perform better than the ones I wrote myself.", name: "James K.", role: "Marketing consultant" },
  { quote: "Went from posting once a week to every single day across 6 platforms. Game changer.", name: "Priya L.", role: "Business coach" },
];

const PRICING = [
  { id: "free",    name: "Free",    price: "$0",   period: "forever",  credits: "3 jobs/mo",       features: ["Blog, Twitter, LinkedIn", "Text input", "Copy & download"],                              cta: "Start free",      href: "/register",               highlight: false },
  { id: "starter", name: "Starter", price: "$19",  period: "/month",   credits: "30 jobs/mo",      features: ["All 10 platforms", "Audio & video upload", "SEO scoring", "Priority queue"],            cta: "Get Starter",     href: "/register?plan=starter",  highlight: false },
  { id: "pro",     name: "Pro",     price: "$49",  period: "/month",   credits: "100 jobs/mo",     features: ["Everything in Starter", "Custom tone presets", "Target audience", "API access (soon)"], cta: "Get Pro",         href: "/register?plan=pro",      highlight: true  },
  { id: "agency",  name: "Agency",  price: "$149", period: "/month",   credits: "Unlimited jobs",  features: ["Everything in Pro", "5 team seats", "White-label exports", "Dedicated support"],        cta: "Get Agency",      href: "/register?plan=agency",   highlight: false },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] } }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f6] text-ink-950 grain overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-ink-100/60 bg-[#f9f9f6]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-200">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-extrabold text-ink-950 tracking-tight">
              Repurpose<span className="gradient-text">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-sm px-4 py-2">Log in</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">
              Start free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 relative">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-brand-700 text-sm font-semibold mb-8 animate-pulse-ring">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Claude AI
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[3.75rem] leading-[1.04] font-extrabold text-ink-950 mb-6 tracking-tight"
          >
            Turn 1 piece of content<br />
            into <span className="gradient-text">10 platform-ready</span> pieces
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-ink-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Creators waste 10+ hours a week reformatting content. RepurposeAI does it in 60 seconds —
            with the right tone, length, and format for every channel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/register" className="btn-primary text-base px-7 py-3.5 shadow-lg shadow-brand-200">
              Start free — no card needed
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-outline text-base px-7 py-3.5">
              See a demo
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm text-ink-400"
          >
            3 free jobs/month · No credit card · Cancel anytime
          </motion.p>
        </div>
      </section>

      {/* ── PLATFORM GRID ───────────────────────────── */}
      <section className="py-14 border-y border-ink-100 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-ink-400 uppercase tracking-widest mb-8">
            1 input → 10 native formats, all generated simultaneously
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
            {PLATFORMS.map((p, i) => (
              <motion.div
                key={p.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border ${p.color}`}
              >
                <span className="text-2xl">{p.icon}</span>
                <span className="text-[10px] font-bold text-center leading-tight">{p.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-extrabold text-ink-950 mb-4 tracking-tight">
              Three steps. Zero wasted hours.
            </h2>
            <p className="text-ink-500 text-lg max-w-xl mx-auto">
              Drop your content in, choose your platforms, and download everything ready to publish.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", emoji: "📥", title: "Drop your content", desc: "Paste text, drop a YouTube link, or upload an MP3/MP4. We handle transcription automatically." },
              { step: "02", emoji: "🤖", title: "Claude adapts it", desc: "Claude reads your content, understands the intent, and generates native-feeling output for every channel you picked." },
              { step: "03", emoji: "🚀", title: "Copy & publish", desc: "Each piece is ready to paste. No editing required — but every output is editable if you want to tweak." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="card p-7 relative overflow-hidden group hover:shadow-md transition-all"
              >
                <span className="absolute top-4 right-4 font-display text-6xl font-extrabold text-ink-50 group-hover:text-ink-100 transition-colors">
                  {item.step}
                </span>
                <div className="text-4xl mb-5">{item.emoji}</div>
                <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{item.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section className="py-24 px-6 bg-ink-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-brand-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-4xl font-extrabold text-white mb-4 tracking-tight">
              Built for serious creators
            </h2>
            <p className="text-ink-400 text-lg max-w-xl mx-auto">
              Not a template tool. RepurposeAI understands context, adapts tone, and preserves your original intent.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex gap-4 p-6 rounded-2xl bg-ink-900 border border-ink-800 hover:border-ink-700 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
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

      {/* ── TESTIMONIALS ────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl font-extrabold text-ink-950 text-center mb-14 tracking-tight"
          >
            Creators who reclaimed their week
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="card p-6 hover:shadow-md transition-all"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} className="text-brand-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-ink-700 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900">{t.name}</p>
                    <p className="text-xs text-ink-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-surface" id="pricing">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-4xl font-extrabold text-ink-950 mb-3 tracking-tight">Simple pricing</h2>
            <p className="text-ink-500 text-lg">Start free. Upgrade when you need more.</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-4">
            {PRICING.map((p, i) => (
              <motion.div
                key={p.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className={`card flex flex-col p-6 relative ${p.highlight ? "ring-2 ring-brand-500 shadow-lg shadow-brand-100" : ""}`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Most popular
                  </div>
                )}
                <p className="text-sm font-bold text-ink-500 mb-1">{p.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-3xl font-extrabold text-ink-950">{p.price}</span>
                  <span className="text-ink-400 text-sm">{p.period}</span>
                </div>
                <p className="text-xs text-ink-400 mb-5">{p.credits}</p>
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
                  className={`w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all ${
                    p.highlight
                      ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-200"
                      : "border-2 border-ink-200 text-ink-700 hover:border-ink-400 hover:bg-ink-50"
                  }`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand-500 to-brand-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl font-extrabold text-white mb-4 tracking-tight"
          >
            Stop reformatting. Start creating.
          </motion.h2>
          <p className="text-brand-100 text-lg mb-10">
            Join thousands of creators who reclaimed their week with RepurposeAI.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-9 py-4 rounded-2xl hover:bg-brand-50 transition-colors shadow-lg text-base"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-brand-200 text-sm">No credit card · 3 free jobs · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-ink-100 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-extrabold text-sm text-ink-900 tracking-tight">
              Repurpose<span className="gradient-text">AI</span>
            </span>
          </div>
          <p className="text-sm text-ink-400">© {new Date().getFullYear()} RepurposeAI. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-ink-400">
            <Link to="/legal/privacy" className="hover:text-ink-700 transition-colors">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-ink-700 transition-colors">Terms</Link>
            <Link to="/legal/contact" className="hover:text-ink-700 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
