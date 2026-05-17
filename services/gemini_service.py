"""Google Gemini text generation via the google-genai SDK."""
from __future__ import annotations

from typing import Any, Dict, Optional

import config

try:
    from google import genai as google_genai
    from google.genai import types
except ImportError:
    google_genai = None
    types = None


def _create_client() -> Optional[Dict[str, Any]]:
    api_key = config.gemini_api_key()
    if not api_key or google_genai is None:
        return None

    try:
        client = google_genai.Client(api_key=api_key)
        return {
            "client": client,
            "model": config.gemini_model(),
        }
    except Exception:
        return None


def get_client():
    """Always fetch fresh client (avoids stale config issues)."""
    return _create_client()


def extract_text_from_response(response: Any) -> str:
    text = getattr(response, "text", None)
    if text and str(text).strip():
        return str(text).strip()

    candidates = getattr(response, "candidates", None) or []
    for cand in candidates:
        content = getattr(cand, "content", None)
        parts = getattr(content, "parts", None) if content else None
        if parts:
            for part in parts:
                t = getattr(part, "text", None)
                if t and str(t).strip():
                    return str(t).strip()

    return ""


def generate_reply(
    prompt: str,
    *,
    temperature: float = 0.8,
    max_output_tokens: int = 512,
) -> str:
    client_data = get_client()
    if client_data is None:
        raise RuntimeError("Gemini not configured")

    client = client_data["client"]
    model = client_data["model"]

    try:
        if types:
            config_obj = types.GenerateContentConfig(
                temperature=temperature,
                top_p=0.95,
                max_output_tokens=max_output_tokens,
            )
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=config_obj,
            )
        else:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

        return extract_text_from_response(response)

    except Exception as e:
        return f"Error generating response: {str(e)}"


def is_configured() -> bool:
    return _create_client() is not None