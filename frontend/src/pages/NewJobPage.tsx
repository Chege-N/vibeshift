import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Type, Link2, Mic, Video, ChevronRight, ChevronLeft,
  Upload, X, Check, Loader2, Info, Target, Tag,
  Sparkles, Zap, Globe, FileText,
} from "lucide-react";
import { clsx } from "clsx";
import { useCreateJob, useUploadJob } from "@/hooks/useQueries";
import { useAuthStore } from "@/hooks/useAuthStore";
import { PLATFORM_LABELS, PLATFORM_ICONS, PLATFORM_COLORS, TONES, type Platform, type ContentType } from "@/types";
import toast from "react-hot-toast";

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[];

const INPUT_TYPES = [
  { type: "text"  as ContentType, icon: Type,  label: "Paste text",  desc: "Blog post, transcript, notes", color: "text-blue-600 bg-blue-50 border-blue-200"    },
  { type: "url"   as ContentType, icon: Globe, label: "URL",         desc: "YouTube, article, any link",  color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { type: "audio" as ContentType, icon: Mic,   label: "Audio file",  desc: "MP3, M4A, WAV, OGG",         color: "text-purple-600 bg-purple-50 border-purple-200"  },
  { type: "video" as ContentType, icon: Video, label: "Video file",  desc: "MP4, MOV, AVI, MKV",         color: "text-rose-600 bg-rose-50 border-rose-200"        },
];

const TONE_EMOJIS: Record<string, string> = {
  professional: "💼", casual: "😊", educational: "🎓",
  entertaining: "🎉", inspirational: "✨", technical: "⚙️",
};

const STEPS = ["Content", "Platforms", "Options"];

export default function NewJobPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const createJob = useCreateJob();
  const uploadJob = useUploadJob();

  const [step, setStep] = useState(0);
  const [contentType, setContentType] = useState<ContentType>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(["blog", "twitter_thread", "linkedin"]);
  const [tone, setTone] = useState("professional");
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");

  const isPaid = user?.plan !== "free";
  const maxPlatforms = isPaid ? 10 : 3;
  // Enforce plan limits
  const platformLimit = maxPlatforms;
  const isLoading = createJob.isPending || uploadJob.isPending;

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".m4a", ".wav", ".ogg"], "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
    maxFiles: 1, maxSize: 500 * 1024 * 1024,
  });

  const togglePlatform = (p: Platform) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return;
      setPlatforms(platforms.filter((x) => x !== p));
    } else {
      if (platforms.length >= maxPlatforms) {
        toast.error(`Free plan: max ${maxPlatforms} platforms. Upgrade for all 10!`);
        return;
      }
      setPlatforms([...platforms, p]);
    }
  };

  const canProceed = () => {
    if (step === 0) {
      if (contentType === "text") return text.trim().length > 50;
      if (contentType === "url")  return url.trim().length > 10;
      return !!file;
    }
    return platforms.length > 0;
  };

  const handleSubmit = async () => {
    try {
      let job;
      if (contentType === "audio" || contentType === "video") {
        const form = new FormData();
        form.append("file", file!);
        form.append("platforms", platforms.join(","));
        form.append("tone", tone);
        if (title)    form.append("title", title);
        if (audience) form.append("target_audience", audience);
        if (keywords) form.append("keywords", keywords);
        job = await uploadJob.mutateAsync(form);
      } else {
        job = await createJob.mutateAsync({
          title: title || undefined,
          content_type: contentType,
          original_content: contentType === "text" ? text : undefined,
          original_url: contentType === "url" ? url : undefined,
          platforms, tone,
          target_audience: audience || undefined,
          keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
        });
      }
      // Navigate on success — job object returned by mutateAsync
      if (job?.id) {
        navigate(`/dashboard/jobs/${job.id}`);
      }
    } catch {
      // onError in the mutation already shows the toast — don't show another
    }
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">New job</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink-950 tracking-tight">
            Turn 1 piece into 10 formats
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            {STEPS[step] === "Content" && "Start by choosing what you want to repurpose."}
            {STEPS[step] === "Platforms" && "Pick which platforms you want to publish on."}
            {STEPS[step] === "Options" && "Fine-tune the tone and SEO settings."}
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => i < step && setStep(i)}
                className={clsx("flex items-center gap-2 text-sm font-semibold transition-all",
                  i === step  ? "text-brand-600" :
                  i < step    ? "text-ink-700 cursor-pointer hover:text-brand-600" :
                                "text-ink-300 cursor-default"
                )}
              >
                <div className={clsx(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  i === step ? "bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-200" :
                  i < step   ? "bg-ink-900 border-ink-900 text-white" :
                               "bg-white border-ink-200 text-ink-400"
                )}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={clsx("h-px w-12 mx-3 transition-colors", i < step ? "bg-ink-900" : "bg-ink-150")} />
              )}
            </div>
          ))}
        </div>

        {/* Step panels */}
        <AnimatePresence mode="wait">

          {/* ── STEP 0: CONTENT ─────────────────────── */}
          {step === 0 && (
            <motion.div key="s0"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}
            >
              {/* Input type selector */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {INPUT_TYPES.map(({ type, icon: Icon, label, desc, color }) => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    className={clsx(
                      "flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                      contentType === type
                        ? "border-brand-500 bg-brand-50 shadow-sm shadow-brand-100"
                        : "border-ink-100 bg-white hover:border-ink-300 hover:bg-surface"
                    )}
                  >
                    <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={clsx("text-sm font-bold", contentType === type ? "text-brand-700" : "text-ink-900")}>
                        {label}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5 leading-tight">{desc}</p>
                    </div>
                    {contentType === type && (
                      <Check className="w-4 h-4 text-brand-500 shrink-0 ml-auto mt-0.5" />
                    )}
                  </button>
                ))}
              </div>

              {/* Text input */}
              {contentType === "text" && (
                <div className="card p-5">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Your content
                    <span className="font-normal text-ink-400 ml-1">(min 50 characters)</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="textarea h-52"
                    placeholder="Paste your blog post, podcast transcript, speech, meeting notes, or any long-form content here…"
                    autoFocus
                  />
                  <div className="flex justify-between mt-2 text-xs text-ink-400">
                    <span className={charCount < 50 ? "text-red-400" : "text-emerald-600"}>
                      {charCount < 50 ? `${50 - charCount} more chars needed` : "✓ Ready"}
                    </span>
                    <span>{wordCount} words · {charCount} chars</span>
                  </div>
                </div>
              )}

              {/* URL input */}
              {contentType === "url" && (
                <div className="card p-5">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Content URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="input pl-10"
                      placeholder="https://youtu.be/dQw4w9WgXcQ  or  https://yoursite.com/blog/..."
                      autoFocus
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { icon: "▶️", label: "YouTube videos" },
                      { icon: "📰", label: "Articles & blogs" },
                      { icon: "🎙️", label: "Podcast pages" },
                    ].map((item) => (
                      <span key={item.label} className="flex items-center gap-1 text-xs text-ink-500 bg-surface px-2.5 py-1 rounded-full border border-ink-100">
                        {item.icon} {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* File upload */}
              {(contentType === "audio" || contentType === "video") && (
                <div className="card p-5">
                  {file ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-50 border-2 border-brand-200">
                      <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-2xl shrink-0">
                        {contentType === "audio" ? "🎙️" : "🎬"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-900 truncate">{file.name}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB · Will be transcribed automatically</p>
                      </div>
                      <button onClick={() => setFile(null)} className="p-2 rounded-xl hover:bg-brand-100 text-ink-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={clsx(
                        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                        isDragActive
                          ? "border-brand-400 bg-brand-50 scale-[1.01]"
                          : "border-ink-200 hover:border-brand-300 hover:bg-surface"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-7 h-7 text-ink-400" />
                      </div>
                      <p className="text-sm font-bold text-ink-700 mb-1">
                        {isDragActive ? "Drop it! 🎯" : "Drop your file or click to browse"}
                      </p>
                      <p className="text-xs text-ink-400">Max 500 MB · Audio or video · AI transcription included</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 1: PLATFORMS ───────────────────── */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}
            >
              <div className="card p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display font-bold text-ink-900">Choose your platforms</h2>
                    <p className="text-xs text-ink-500 mt-0.5">Each platform gets a uniquely formatted piece</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "text-sm font-bold tabular-nums",
                      platforms.length >= maxPlatforms ? "text-brand-600" : "text-ink-700"
                    )}>
                      {platforms.length}
                    </span>
                    <span className="text-ink-300 text-sm">/</span>
                    <span className="text-sm text-ink-400">{maxPlatforms}</span>
                  </div>
                </div>

                {!isPaid && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 flex-1">
                      Free plan: 3 platforms max.
                    </p>
                    <button
                      onClick={() => navigate("/dashboard/pricing")}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
                    >
                      Upgrade →
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {ALL_PLATFORMS.map((p) => {
                    const selected = platforms.includes(p);
                    const locked = !selected && !isPaid && platforms.length >= 3;
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        disabled={locked}
                        className={clsx(
                          "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group",
                          selected  ? "border-brand-500 bg-brand-50 shadow-sm shadow-brand-100" :
                          locked    ? "border-ink-100 bg-surface opacity-40 cursor-not-allowed" :
                                      "border-ink-100 bg-white hover:border-ink-300"
                        )}
                      >
                        <span className="text-lg shrink-0">{PLATFORM_ICONS[p]}</span>
                        <span className={clsx("text-sm font-semibold flex-1 truncate",
                          selected ? "text-brand-700" : "text-ink-800"
                        )}>
                          {PLATFORM_LABELS[p]}
                        </span>
                        <div className={clsx(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          selected ? "bg-brand-500 border-brand-500" : "border-ink-200 group-hover:border-ink-400"
                        )}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected preview */}
                {platforms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-ink-100 flex flex-wrap gap-1.5">
                    {platforms.map((p) => (
                      <span key={p} className={clsx("badge text-[11px]", PLATFORM_COLORS[p])}>
                        {PLATFORM_ICONS[p]} {PLATFORM_LABELS[p]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: OPTIONS ─────────────────────── */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}
            >
              <div className="card p-5 mb-4 space-y-5">

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                    <FileText className="inline w-3.5 h-3.5 mr-1.5 text-ink-400" />
                    Job title <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                    placeholder="e.g. Ep. 42 — How to Build a Morning Routine"
                  />
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    <Sparkles className="inline w-3.5 h-3.5 mr-1.5 text-ink-400" />
                    Tone of voice
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={clsx(
                          "py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center gap-1.5 justify-center",
                          tone === t.value
                            ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                            : "border-ink-100 text-ink-600 hover:border-ink-300 bg-white"
                        )}
                      >
                        <span className="text-base leading-none">{TONE_EMOJIS[t.value]}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                    <Target className="inline w-3.5 h-3.5 mr-1.5 text-ink-400" />
                    Target audience <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="input"
                    placeholder="e.g. Startup founders, fitness enthusiasts, B2B marketers"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                    <Tag className="inline w-3.5 h-3.5 mr-1.5 text-ink-400" />
                    SEO keywords <span className="font-normal text-ink-400">(optional, comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="input"
                    placeholder="content marketing, repurposing, creator economy"
                  />
                </div>
              </div>

              {/* Summary card */}
              <div className="rounded-2xl bg-ink-950 p-5 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-brand-400" />
                  <h3 className="font-display font-bold text-sm">Ready to launch</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Input", value: contentType === "text" ? `Text (${wordCount} words)` : contentType === "url" ? "URL" : file?.name || "File" },
                    { label: "Platforms", value: `${platforms.length} selected` },
                    { label: "Tone", value: `${TONE_EMOJIS[tone]} ${TONES.find(t => t.value === tone)?.label}` },
                    { label: "Credit cost", value: "1 credit", highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-ink-400">{label}</span>
                      <span className={clsx("font-semibold", highlight ? "text-brand-400" : "text-white")}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-40"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary disabled:opacity-60 min-w-[140px]"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Launch job</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
