"""
RepurposeService — The heart of RepurposeAI.
Uses Claude to intelligently adapt content for each platform.
Calls are made CONCURRENTLY using asyncio.gather() for speed.
"""
import asyncio
import anthropic
import re
from typing import List, Dict, Optional
from app.core.config import settings
from app.models.models import Platform

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

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
- Include meta description (155 chars max) at the very top as: Meta: ...
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
- Tweets 2-12: One insight per tweet, easy to read standalone
- Use line breaks for visual spacing
- Add relevant emojis sparingly
- Final tweet: Summary + strong CTA to follow/share
Format each as: 1/ [tweet text]
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
- End with a question to drive comments
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
- Emojis to add personality and break up text
- Strong CTA (save, share, comment)
- Separator line (—)
- 20-30 relevant hashtags grouped by size
""",
    },
    Platform.YOUTUBE_DESC: {
        "name": "YouTube Description",
        "target_length": "300-500 words",
        "format": "structured description",
        "instructions": """
Create an optimized YouTube video description:
- First 2 lines: Hook + keyword-rich summary (shown before 'more')
- Timestamps section with estimated chapters
- About this video: 2-3 paragraph description
- Key points covered (bulleted)
- Resources/links section (with [LINK] placeholders)
- Subscribe CTA
- 5-8 relevant tags at the very end after Tags:
""",
    },
    Platform.NEWSLETTER: {
        "name": "Email Newsletter",
        "target_length": "400-600 words",
        "format": "email-ready sections",
        "instructions": """
Create an email newsletter section:
- Subject line: (3 A/B/C options)
- Preview text: (85 chars max)
- Opening hook paragraph
- Main content in 3-4 digestible sections with subheadings
- Key takeaway box (bold the main insight)
- CTA suggestion
- P.S. line
Write conversationally. Optimise for scanability.
""",
    },
    Platform.TIKTOK_SCRIPT: {
        "name": "TikTok Script",
        "target_length": "45-60 seconds spoken",
        "format": "video script with timing",
        "instructions": """
Create a TikTok video script:
- [HOOK 0-3s]: Attention-grabbing opening line
- [SETUP 3-10s]: Context + why they should care
- [CONTENT 10-45s]: Main value in quick, punchy beats
- [CTA 45-60s]: Follow + share prompt
Add [B-ROLL: description] cues for visual ideas.
Write exactly what to say out loud. Conversational, energetic.
""",
    },
    Platform.REDDIT: {
        "name": "Reddit Post",
        "target_length": "300-600 words",
        "format": "reddit markdown",
        "instructions": """
Create a Reddit-native post:
- Title: Genuine, not clickbait (question or real insight)
- Body: Conversational, community-aware tone
- Add value without heavy self-promotion
- Invite discussion at the end with a genuine question
- Suggest 2-3 relevant subreddits: r/...
Reddit users hate obvious marketing. Write like a genuine community member.
""",
    },
    Platform.PODCAST_NOTES: {
        "name": "Podcast Show Notes",
        "target_length": "300-500 words",
        "format": "structured show notes",
        "instructions": """
Create comprehensive podcast show notes:
- Episode title suggestion
- One-paragraph episode summary (hook for listeners)
- Key topics covered (bulleted)
- Chapter markers with estimated timestamps
- 3-5 key quotes from the content
- Resources mentioned ([LINK] placeholders)
- Subscribe/review CTA
Optimise for Apple Podcasts and Spotify search.
""",
    },
    Platform.REEL_SCRIPT: {
        "name": "Reel/Short Script",
        "target_length": "30-60 seconds",
        "format": "reel script with cues",
        "instructions": """
Create a Reels/Shorts script:
- [0-3s HOOK]: Visual hook + spoken hook
- [3-25s VALUE]: Core insight delivered fast
- [25-55s PROOF/EXAMPLE]: Quick demonstration
- [55-60s CTA]: Follow for more
Include [ON-SCREEN TEXT: ...] cues for caption overlays.
Write for vertical video. Every second counts.
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


async def _generate_for_platform(
    platform: Platform,
    original_content: str,
    tone_desc: str,
    audience_note: str,
    keywords_note: str,
    title_note: str,
) -> tuple[str, str]:
    """Generate content for a single platform. Returns (platform_value, content)."""
    spec = PLATFORM_SPECS.get(platform)
    if not spec:
        return platform.value, ""

    prompt = f"""You are an expert content strategist and copywriter specialising in repurposing content across platforms.

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

RULES:
1. Preserve the core message and insights of the original
2. Do NOT invent facts not present in the original
3. Adapt language, structure, and format NATIVELY for this platform
4. Match the specified tone throughout
5. Output ONLY the platform-ready content — no preamble or commentary"""

    message = await client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return platform.value, message.content[0].text


async def repurpose_content(
    original_content: str,
    platforms: List[Platform],
    tone: str = "professional",
    target_audience: Optional[str] = None,
    keywords: Optional[List[str]] = None,
    title: Optional[str] = None,
) -> Dict[str, str]:
    """
    Generate platform-optimised content for all requested platforms CONCURRENTLY.
    Much faster than sequential calls — all Claude requests fire at the same time.
    """
    tone_desc = TONE_DESCRIPTIONS.get(tone, tone)
    audience_note = f"Target audience: {target_audience}" if target_audience else ""
    keywords_note = f"Priority keywords to include naturally: {', '.join(keywords)}" if keywords else ""
    title_note = f"Original title/topic: {title}" if title else ""

    tasks = [
        _generate_for_platform(p, original_content, tone_desc, audience_note, keywords_note, title_note)
        for p in platforms
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    output = {}
    for result in results:
        if isinstance(result, Exception):
            # Log but don't fail the whole job if one platform errors
            import logging
            logging.getLogger(__name__).error("Platform generation error: %s", result)
            continue
        platform_key, content = result
        output[platform_key] = content

    return output


def calculate_seo_score(content: str, keywords: Optional[List[str]] = None) -> float:
    """
    SEO score out of 100 based on:
    - Word count in optimal range      (0-25 pts)
    - Keyword presence and density     (0-25 pts)
    - Header structure                 (0-20 pts)
    - Content structure signals        (0-15 pts)
    - Readability (sentence length)    (0-15 pts)
    """
    score = 0.0
    words = content.split()
    word_count = len(words)

    # Word count (optimal 300-2000)
    if 300 <= word_count <= 500:
        score += 15
    elif 500 < word_count <= 2000:
        score += 25
    elif 100 <= word_count < 300:
        score += 8

    # Keywords
    if keywords:
        content_lower = content.lower()
        matched = sum(1 for kw in keywords if kw.lower() in content_lower)
        keyword_ratio = matched / len(keywords)
        score += keyword_ratio * 25

        # Keyword in first 100 words
        first_100 = " ".join(words[:100]).lower()
        if any(kw.lower() in first_100 for kw in keywords):
            score += 5
    else:
        score += 12  # neutral if no keywords specified

    # Headers (markdown or HTML)
    has_h1 = bool(re.search(r"^#{1}\s+\w+|<h1", content, re.MULTILINE | re.IGNORECASE))
    has_h2 = bool(re.search(r"^#{2}\s+\w+|<h2", content, re.MULTILINE | re.IGNORECASE))
    if has_h1:
        score += 10
    if has_h2:
        score += 10

    # Structure signals
    has_list = bool(re.search(r"^[\-\*\d]\s+\w+", content, re.MULTILINE))
    has_paragraphs = content.count("\n\n") >= 2
    if has_list:
        score += 8
    if has_paragraphs:
        score += 7

    # Readability — avg sentence length under 25 words
    sentences = re.split(r"[.!?]+", content)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    if sentences:
        avg_len = sum(len(s.split()) for s in sentences) / len(sentences)
        if avg_len <= 20:
            score += 15
        elif avg_len <= 25:
            score += 10
        elif avg_len <= 35:
            score += 5

    return min(100.0, round(score, 1))
