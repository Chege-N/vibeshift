import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Type, Link2, Mic, Video, ChevronRight, ChevronLeft,
  Upload, X, Check, Loader2, Info, Target, Tag,
} from "lucide-react";
import { clsx } from "clsx";
import { useCreateJob, useUploadJob } from "@/hooks/useQueries";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  PLATFORM_LABELS, PLATFORM_ICONS, TONES,
  type Platform, type ContentType,
} from "@/types";
import toast from "react-hot-toast";

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[];

const INPUT_TYPES = [
  { type: "text" as ContentType,  icon: Type,   label: "Paste text",       desc: "Blog post, transcript, notes" },
  { type: "url"  as ContentType,  icon: Link2,  label: "URL",              desc: "YouTube, article, tweet" },
  { type: "audio"as ContentType,  icon: Mic,    label: "Audio file",       desc: "MP3, M4A, WAV, OGG" },
  { type: "video"as ContentType,  icon: Video,  label: "Video file",       desc: "MP4, MOV, AVI, MKV" },
];

const STEP_LABELS = ["Content", "Platforms", "Options"];

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

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".m4a", ".wav", ".ogg"],
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
  });

  const togglePlatform = (p: Platform) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return;
      setPlatforms(platforms.filter((x) => x !== p));
    } else {
      if (platforms.length >= maxPlatforms) {
        toast.error(`Free plan limited to ${maxPlatforms} platforms. Upgrade for all 10!`);
        return;
      }
      setPlatforms([...platforms, p]);
    }
  };

  const canProceed = () => {
    if (step === 0) {
      if (contentType === "text") return text.trim().length > 50;
      if (contentType === "url") return url.trim().length > 0;
      if (contentType === "audio" || contentType === "video") return !!file;
    }
    if (step === 1) return platforms.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    try {
      let job;
      if (contentType === "audio" || contentType === "video") {
        const form = new FormData();
        form.append("file", file!);
        form.append("platforms", platforms.join(","));
        form.append("tone", tone);
        if (title) form.append("title", title);
        if (audience) form.append("target_audience", audience);
        if (keywords) form.append("keywords", keywords);
        job = await uploadJob.mutateAsync(form);
      } else {
        job = await createJob.mutateAsync({
          title: title || undefined,
          content_type: contentType,
          original_content: contentType === "text" ? text : undefined,
          original_url: contentType === "url" ? url : undefined,
          platforms,
          tone,
          target_audience: audience || undefined,
          keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
        });
      }
      navigate(`/dashboard/jobs/${job.id}`);
    } catch {}
  };

  const isLoading = createJob.isPending || uploadJob.isPending;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-950 mb-1">New repurposing job</h1>
        <p className="text-ink-500 text-sm">Turn one piece of content into up to 10 platform-ready pieces.</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={clsx(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                i === step ? "text-brand-600" : i < step ? "text-ink-700 cursor-pointer" : "text-ink-300 cursor-default"
              )}
            >
              <div className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                i === step ? "bg-brand-500 text-white" : i < step ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-400"
              )}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div className={clsx("flex-1 h-px w-8", i < step ? "bg-ink-900" : "bg-ink-200")} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 0: Content ─────────────────────────── */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card p-6 mb-6">
              <h2 className="font-display font-bold text-ink-900 mb-4">Choose your input type</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {INPUT_TYPES.map(({ type, icon: Icon, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    className={clsx(
                      "flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left",
                      contentType === type
                        ? "border-brand-500 bg-brand-50"
                        : "border-ink-100 hover:border-ink-300 bg-white"
                    )}
                  >
                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center mb-1",
                      contentType === type ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-ink-900">{label}</span>
                    <span className="text-xs text-ink-500">{desc}</span>
                  </button>
                ))}
              </div>

              {/* Content input */}
              {contentType === "text" && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">
                    Your content <span className="text-ink-400 font-normal">(min 50 chars)</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="input resize-none h-48 leading-relaxed"
                    placeholder="Paste your blog post, podcast transcript, speech, notes, or any long-form content here…"
                  />
                  <p className="text-xs text-ink-400 mt-1.5">{text.length} characters</p>
                </div>
              )}

              {contentType === "url" && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Content URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="input pl-10"
                      placeholder="https://youtu.be/... or https://yoursite.com/blog/..."
                    />
                  </div>
                  <p className="text-xs text-ink-400 mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Supports YouTube videos, public articles, podcast pages
                  </p>
                </div>
              )}

              {(contentType === "audio" || contentType === "video") && (
                <div>
                  {file ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 border-2 border-brand-200">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                        {contentType === "audio" ? <Mic className="w-5 h-5 text-brand-600" /> : <Video className="w-5 h-5 text-brand-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{file.name}</p>
                        <p className="text-xs text-ink-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button onClick={() => setFile(null)} className="p-1 rounded-md hover:bg-brand-100 text-ink-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={clsx(
                        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                        isDragActive ? "border-brand-400 bg-brand-50" : "border-ink-200 hover:border-ink-400 hover:bg-ink-50"
                      )}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-ink-700 mb-1">
                        {isDragActive ? "Drop it here!" : "Drop your file or click to browse"}
                      </p>
                      <p className="text-xs text-ink-400">Max 500MB · Audio or video files</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Platforms ───────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-ink-900">Choose platforms</h2>
                <span className="text-xs text-ink-500">{platforms.length} / {maxPlatforms} selected</span>
              </div>
              {!isPaid && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  Free plan: 3 platforms max.{" "}
                  <button onClick={() => navigate("/dashboard/pricing")} className="underline font-medium ml-1">Upgrade for all 10</button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {ALL_PLATFORMS.map((p) => {
                  const selected = platforms.includes(p);
                  const locked = !selected && !isPaid && platforms.length >= 3;
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      disabled={locked}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        selected ? "border-brand-500 bg-brand-50" : "border-ink-100 hover:border-ink-300 bg-white",
                        locked && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span className="text-xl">{PLATFORM_ICONS[p]}</span>
                      <span className="text-sm font-medium text-ink-800">{PLATFORM_LABELS[p]}</span>
                      {selected && <Check className="w-4 h-4 text-brand-500 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Options ─────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card p-6 mb-6 space-y-5">
              <h2 className="font-display font-bold text-ink-900">Fine-tune your output</h2>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Job title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="e.g. Ep. 42 — How to Build a Morning Routine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Tone</label>
                <div className="grid grid-cols-3 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={clsx(
                        "py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all",
                        tone === t.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-100 text-ink-600 hover:border-ink-300"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  <Target className="inline w-3.5 h-3.5 mr-1" />
                  Target audience (optional)
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="input"
                  placeholder="e.g. Startup founders, fitness enthusiasts, B2B marketers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  <Tag className="inline w-3.5 h-3.5 mr-1" />
                  SEO keywords (optional, comma-separated)
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

            {/* Summary */}
            <div className="card p-5 bg-ink-950 text-white">
              <h3 className="font-display font-bold mb-3">Job summary</h3>
              <div className="space-y-2 text-sm text-ink-300">
                <div className="flex justify-between">
                  <span>Input type</span>
                  <span className="text-white font-medium capitalize">{contentType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platforms</span>
                  <span className="text-white font-medium">{platforms.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span>Tone</span>
                  <span className="text-white font-medium capitalize">{tone}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-ink-800">
                  <span>Credits used</span>
                  <span className="text-brand-400 font-bold">1 credit</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="btn-ghost disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step < 2 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-40"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary disabled:opacity-60"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><Check className="w-4 h-4" /> Launch job</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
