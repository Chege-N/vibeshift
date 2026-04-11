"""
URL content fetcher.
Extracts clean readable text from URLs — articles, YouTube pages, etc.
Uses httpx + basic HTML parsing. No heavy dependencies needed.
"""
import re
import httpx
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# YouTube URL patterns
YT_PATTERNS = [
    r"(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def _is_youtube(url: str) -> bool:
    return any(re.search(p, url) for p in YT_PATTERNS)


def _extract_youtube_id(url: str) -> Optional[str]:
    for p in YT_PATTERNS:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def _strip_html(html: str) -> str:
    """Remove HTML tags and clean up whitespace."""
    # Remove scripts and styles entirely
    html = re.sub(r"<(script|style|nav|header|footer|aside)[^>]*>.*?</\1>",
                  "", html, flags=re.DOTALL | re.IGNORECASE)
    # Remove all remaining tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Decode common HTML entities
    for ent, ch in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                    ("&quot;", '"'), ("&#39;", "'"), ("&nbsp;", " ")]:
        text = text.replace(ent, ch)
    # Collapse whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def _extract_meta(html: str, name: str) -> str:
    """Extract meta tag content."""
    patterns = [
        rf'<meta[^>]+name=["\']og:{name}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+property=["\']og:{name}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+name=["\']{name}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']og:{name}["\']',
    ]
    for p in patterns:
        m = re.search(p, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return ""


def _extract_title(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if m:
        return re.sub(r"<[^>]+>", "", m.group(1)).strip()
    return _extract_meta(html, "title")


def _extract_article_body(html: str) -> str:
    """Try to pull the main article content before falling back to full text."""
    # Try common article containers
    for tag in ["article", "main", '[class*="content"]', '[class*="post"]', '[class*="article"]']:
        m = re.search(rf"<{tag}[^>]*>(.*?)</{tag.split('[')[0]}>",
                      html, re.DOTALL | re.IGNORECASE)
        if m and len(m.group(1)) > 500:
            return _strip_html(m.group(1))
    return _strip_html(html)


async def fetch_url_content(url: str) -> dict:
    """
    Fetch and extract readable content from a URL.
    Returns: { title, content, source_url, content_type }
    Raises: ValueError on failure.
    """
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # ── YouTube ──────────────────────────────────────────────
    if _is_youtube(url):
        video_id = _extract_youtube_id(url)
        # Fetch the page to get title and description
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                html = resp.text
            except Exception as e:
                raise ValueError(f"Could not fetch YouTube page: {e}")

        title = _extract_title(html)
        description = _extract_meta(html, "description")

        # Extract auto-generated description from page data
        desc_match = re.search(r'"shortDescription":"(.*?)"(?:,"isCrawlable")', html, re.DOTALL)
        if desc_match:
            description = desc_match.group(1).replace("\\n", "\n").replace('\\"', '"')

        if not description:
            raise ValueError("Could not extract YouTube video description. Video may be private.")

        content = f"Title: {title}\n\nVideo Description:\n{description}"
        return {"title": title, "content": content, "source_url": url, "content_type": "youtube"}

    # ── General web article ──────────────────────────────────
    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except httpx.TimeoutException:
            raise ValueError(f"Request timed out fetching: {url}")
        except httpx.HTTPStatusError as e:
            raise ValueError(f"HTTP {e.response.status_code} fetching: {url}")
        except Exception as e:
            raise ValueError(f"Could not fetch URL: {e}")

    content_type_header = resp.headers.get("content-type", "")
    if "text/html" not in content_type_header and "application/xhtml" not in content_type_header:
        raise ValueError(f"URL does not return HTML content (got: {content_type_header})")

    html = resp.text
    title = _extract_title(html)
    description = _extract_meta(html, "description")
    body = _extract_article_body(html)

    # Require minimum viable content
    if len(body) < 200:
        raise ValueError(
            "Could not extract enough readable content from this URL. "
            "Try pasting the article text directly instead."
        )

    # Cap at ~8000 words to stay within Claude context limits
    words = body.split()
    if len(words) > 8000:
        body = " ".join(words[:8000]) + "\n\n[Content truncated for processing]"

    content = f"Title: {title}\n\n"
    if description:
        content += f"Summary: {description}\n\n"
    content += f"Article Content:\n{body}"

    logger.info("Fetched URL %s — %d chars extracted", url, len(content))
    return {"title": title, "content": content, "source_url": url, "content_type": "article"}
