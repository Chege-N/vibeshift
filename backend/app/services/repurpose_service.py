"""
RepurposeService — The heart of RepurposeAI.
Uses Claude to intelligently adapt content for each platform,
preserving the creator's voice while optimizing for each channel.
"""
import anthropic
from typing import List, Dict, Optional
from app.core.config import settings
from app.models.models import Platform

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Platform-specific specs and prompts
PLATFORM_SPECS = {
    Platform.BLOG: {
        "name": "Blog Post",
        "target_length": "1200-2000 words",
        "format": "markdown",
        "instructions": """
Create a comprehensive, SEO-optimized blog post with:
- Compelling H1 title with primary keyword
- Introduction with hook and clear value proposition
- 4-6 H2 sections with detailed explanations
- Practical examples and actionable takeaways
- FAQ section (3-5 questions)
- Conclusion with CTA
- Include meta description (155 chars max) at the top
Use natural keyword placement. Write for humans first, SEO second.
""",
    },
    Platform.TWITTER_THREAD: {
        "name": "Twitter/X Thread",
        "target_length": "10-15 tweets",
        "format": "numbered tweets",
        "instructions": """
Create a viral Twitter/X thread:
- Tweet 1: Bold, curiosity-gap hook (max 280 chars)
- Tweets 2-12: One insight per tweet, easy to read
- Each tweet standalone valuable AND part of the narrative
- Use line breaks for visual spacing
- Add relevant emojis sparingly
- Final tweet: Summary + strong CTA to follow/share
Format as: 1/ [tweet] 2/ [tweet] etc.
""",
    },
    Platform.LINKEDIN: {
        "name": "LinkedIn Post",
        "target_length": "150-300 words",
        "format": "plain text with line breaks",
        "instructions": """
Create a high-performing LinkedIn post:
- First line: Stop-scroll hook (no clickbait)
- 2-3 short paragraphs with key insight or story
- Professional yet personal tone
- Concrete value or lesson
- 3-5 relevant hashtags at the end
- CTA: question to drive comments
LinkedIn rewards posts that spark discussion.
""",
    },
    Platform.INSTAGRAM: {
        "name": "Instagram Caption",
        "target_length": "150-220 words",
        "format": "caption with hashtags",
        "instructions": """
Create an engaging Instagram caption:
- Hook in first line (visible before 'more')
- Story or insight in 3-5 short paragraphs
- Emojis to add personality and break text
- Strong CTA (save, share, comment)
- Line: "—"
- 20-30 relevant hashtags in 3 groups (niche, medium, broad)
Keep it conversational and authentic.
""",
    },
    Platform.YOUTUBE_DESC: {
        "name": "YouTube Description",
        "target_length": "300-500 words",
        "format": "structured description",
        "instructions": """
Create an optimized YouTube video description:
- First 2 lines: Hook + keyword-rich summary (shown before 'more')
- Timestamps section with chapters (estimate based on content)
- About this video: 2-3 paragraph description
- Key points covered (bulleted)
- Resources/links section (placeholders)
- Subscribe CTA
- 5-8 relevant tags at the very end
Focus on searchability and click-through.
""",
    },
    Platform.NEWSLETTER: {
        "name": "Email Newsletter",
        "target_length": "400-600 words",
        "format": "email-ready HTML sections",
        "instructions": """
Create an email newsletter section:
- Subject line options (3 variations A/B/C)
- Preview text (85 chars)
- Greeting
- Opening hook paragraph
- Main content in 3-4 digestible sections
- Key takeaway box
- CTA button text suggestion
- P.S. line
Write conversationally. Optimize for scanability.
""",
    },
    Platform.TIKTOK_SCRIPT: {
        "name": "TikTok Script",
        "target_length": "45-60 seconds",
        "format": "video script",
        "instructions": """
Create a TikTok video script:
- [HOOK 0-3s]: Attention-grabbing opening line
- [SETUP 3-10s]: Context + why they should care
- [CONTENT 10-45s]: Main value in quick, punchy beats
- [CTA 45-60s]: Follow + share prompt
Add [B-ROLL SUGGESTION] notes for visual ideas.
Write exactly what to say out loud. Conversational, energetic.
Include estimated timing for each section.
""",
    },
    Platform.REDDIT: {
        "name": "Reddit Post",
        "target_length": "300-600 words",
        "format": "reddit markdown",
        "instructions": """
Create a Reddit-native post:
- Title: Genuine, not clickbait (question or insight)
- Content: Conversational, community-aware tone
- Add value without heavy self-promotion
- Invite discussion at the end
- Suggest 2-3 subreddits it could fit (r/...)
Reddit users hate obvious marketing. Write like a real member sharing a genuine insight.
""",
    },
    Platform.PODCAST_NOTES: {
        "name": "Podcast Show Notes",
        "target_length": "300-500 words",
        "format": "show notes",
        "instructions": """
Create comprehensive podcast show notes:
- Episode title suggestion
- One-paragraph episode summary
- Key topics covered (bulleted)
- Chapter markers with timestamps (estimated)
- Key quotes from the content (3-5)
- Resources mentioned (with placeholders)
- Guest bio placeholder (if applicable)
- Subscribe/review CTA
Optimize for podcast directories (Apple, Spotify).
""",
    },
    Platform.REEL_SCRIPT: {
        "name": "Reel/Short Script",
        "target_length": "30-60 seconds",
        "format": "reel script",
        "instructions": """
Create a Reels/Shorts script:
- [0-3s HOOK]: Visual hook + spoken hook
- [3-25s VALUE]: Core insight delivered fast
- [25-55s PROOF]: Quick example or demonstration
- [55-60s CTA]: Follow for more + overlay text suggestion
Keep it punchy. Every second counts.
Include [ON-SCREEN TEXT] cues for captions overlay.
Write for vertical video viewing.
""",
    },
}


TONE_DESCRIPTIONS = {
    "professional": "authoritative, clear, and credible — suitable for business audiences",
    "casual": "friendly, conversational, and approachable — like talking to a smart friend",
    "educational": "informative, structured, and thorough — teacher meets mentor",
    "entertaining": "witty, engaging, and fun — keeps readers hooked",
    "inspirational": "motivating, uplifting, and empowering — moves people to action",
    "technical": "precise, detailed, and expert-level — for technically sophisticated audiences",
}


async def repurpose_content(
    original_content: str,
    platforms: List[Platform],
    tone: str = "professional",
    target_audience: Optional[str] = None,
    keywords: Optional[List[str]] = None,
    title: Optional[str] = None,
) -> Dict[str, str]:
    """
    Takes original content and generates platform-optimized versions
    using Claude with platform-specific prompts.
    """
    tone_desc = TONE_DESCRIPTIONS.get(tone, tone)
    audience_note = f"Target audience: {target_audience}" if target_audience else ""
    keywords_note = f"Priority keywords to naturally include: {', '.join(keywords)}" if keywords else ""
    title_note = f"Original title/topic: {title}" if title else ""

    results = {}

    for platform in platforms:
        spec = PLATFORM_SPECS.get(platform)
        if not spec:
            continue

        prompt = f"""You are an expert content strategist and copywriter specializing in repurposing content across platforms.

{title_note}
{audience_note}
{keywords_note}

ORIGINAL CONTENT:
---
{original_content}
---

TASK: Repurpose this content for {spec['name']}.

PLATFORM REQUIREMENTS:
- Target length: {spec['target_length']}
- Format: {spec['format']}
- Tone: {tone_desc}

SPECIFIC INSTRUCTIONS:
{spec['instructions']}

IMPORTANT RULES:
1. Preserve the core message, insights, and value of the original content
2. Do NOT add information that wasn't in the original
3. Adapt language, structure, and format NATIVELY for this platform
4. Match the specified tone throughout
5. Make it feel like it was written specifically for this platform — not copied from elsewhere

Output ONLY the platform-ready content. No preamble, no meta-commentary."""

        message = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        results[platform.value] = message.content[0].text

    return results


def calculate_seo_score(content: str, keywords: Optional[List[str]] = None) -> float:
    """Simple SEO scoring heuristic."""
    score = 50.0

    # Length check
    word_count = len(content.split())
    if 300 <= word_count <= 2500:
        score += 20

    # Keyword density
    if keywords:
        content_lower = content.lower()
        hits = sum(content_lower.count(kw.lower()) for kw in keywords)
        if hits >= len(keywords):
            score += 20

    # Headers present
    if "#" in content or "<h" in content.lower():
        score += 10

    return min(100.0, score)
