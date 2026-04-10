export type PlanType = "free" | "starter" | "pro" | "agency";
export type JobStatus = "pending" | "transcribing" | "processing" | "completed" | "failed";
export type ContentType = "text" | "audio" | "video" | "url";

export type Platform =
  | "blog"
  | "twitter_thread"
  | "linkedin"
  | "instagram"
  | "youtube_desc"
  | "newsletter"
  | "tiktok_script"
  | "reddit"
  | "podcast_notes"
  | "reel_script";

export const PLATFORM_LABELS: Record<Platform, string> = {
  blog: "Blog Post",
  twitter_thread: "Twitter Thread",
  linkedin: "LinkedIn Post",
  instagram: "Instagram Caption",
  youtube_desc: "YouTube Description",
  newsletter: "Newsletter",
  tiktok_script: "TikTok Script",
  reddit: "Reddit Post",
  podcast_notes: "Podcast Notes",
  reel_script: "Reel Script",
};

export const PLATFORM_ICONS: Record<Platform, string> = {
  blog: "📝",
  twitter_thread: "🐦",
  linkedin: "💼",
  instagram: "📸",
  youtube_desc: "▶️",
  newsletter: "📧",
  tiktok_script: "🎵",
  reddit: "🤖",
  podcast_notes: "🎙️",
  reel_script: "🎬",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  blog:           "bg-blue-50 text-blue-700 border-blue-200",
  twitter_thread: "bg-sky-50 text-sky-700 border-sky-200",
  linkedin:       "bg-indigo-50 text-indigo-700 border-indigo-200",
  instagram:      "bg-pink-50 text-pink-700 border-pink-200",
  youtube_desc:   "bg-red-50 text-red-700 border-red-200",
  newsletter:     "bg-amber-50 text-amber-700 border-amber-200",
  tiktok_script:  "bg-slate-50 text-slate-700 border-slate-200",
  reddit:         "bg-orange-50 text-orange-700 border-orange-200",
  podcast_notes:  "bg-purple-50 text-purple-700 border-purple-200",
  reel_script:    "bg-green-50 text-green-700 border-green-200",
};

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  plan: PlanType;
  credits_used: number;
  credits_remaining: number;
  monthly_credit_limit: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface RepurposeOutput {
  id: number;
  platform: Platform;
  content: string;
  char_count: number;
  word_count: number;
  seo_score: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Job {
  id: number;
  title: string | null;
  content_type: ContentType;
  platforms: string[];
  tone: string;
  status: JobStatus;
  error_message: string | null;
  processing_time_seconds: number | null;
  credits_consumed: number;
  created_at: string;
  completed_at: string | null;
  outputs: RepurposeOutput[];
}

export interface DashboardStats {
  total_jobs: number;
  completed_jobs: number;
  total_outputs: number;
  credits_used: number;
  credits_remaining: number;
  plan: string;
  popular_platform: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual",       label: "Casual" },
  { value: "educational",  label: "Educational" },
  { value: "entertaining", label: "Entertaining" },
  { value: "inspirational",label: "Inspirational" },
  { value: "technical",    label: "Technical" },
] as const;

export const PLAN_LIMITS: Record<PlanType, { platforms: number; label: string }> = {
  free:    { platforms: 3,  label: "Free" },
  starter: { platforms: 10, label: "Starter" },
  pro:     { platforms: 10, label: "Pro" },
  agency:  { platforms: 10, label: "Agency" },
};
