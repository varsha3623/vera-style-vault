from __future__ import annotations

import re
from typing import Any, Dict, List

from fastapi import APIRouter

from db.wardrobe_store import list_wardrobe_for_user
from schemas import ChatRequest, ChatResponse
from services import gemini_service

router = APIRouter(tags=["chat"])


# ----------------------------
# HELPERS
# ----------------------------
def _sanitize_email(raw: str | None) -> str | None:
    if raw is None:
        return None

    s = str(raw).strip().lower()

    if not s or "@" not in s:
        return None

    return s[:254]


def _is_greeting(message: str) -> bool:
    msg = message.lower().strip()

    greetings = [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good evening",
        "how are you",
        "bye",
        "thanks",
    ]

    return any(x in msg for x in greetings)


def pick_relevant_items(items: List[Dict[str, Any]], message: str):
    msg = message.lower()

    scored = []

    for item in items:
        score = 0

        text = (
            f"{item.get('item_name', '')} "
            f"{item.get('category', '')} "
            f"{item.get('color', '')}"
        ).lower()

        # keyword match
        for word in msg.split():
            if word in text:
                score += 2

        # formal
        if any(x in msg for x in ["meeting", "office", "formal", "interview"]):
            if any(x in text for x in ["shirt", "blazer", "pant", "shoe"]):
                score += 3

        # party/date
        if any(x in msg for x in ["party", "date", "outing"]):
            if any(x in text for x in ["dress", "heel", "top"]):
                score += 3

        # rainy
        if "rain" in msg or "weather" in msg:
            if any(x in text for x in ["black", "blue", "dark"]):
                score += 2

        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [x[1] for x in scored[:3]]


def build_prompt(message: str, wardrobe_text: str, has_items: bool):
    if _is_greeting(message):
        return (
            "You are VÉRA, a friendly AI stylist.\n"
            "Reply naturally and shortly.\n"
            "Do not mention wardrobe unless user asks fashion.\n\n"
            f"User: {message}"
        )

    if has_items:
        return (
            "You are VÉRA, an advanced AI fashion stylist.\n"
            "Use ONLY the wardrobe items below.\n"
            "Pick only relevant items.\n"
            "Do not repeat same answers.\n"
            "Keep response natural and stylish.\n\n"
            f"WARDROBE:\n{wardrobe_text}\n\n"
            f"User: {message}"
        )

    return (
        "You are VÉRA, an AI stylist.\n"
        "User has no wardrobe items.\n"
        "Give general outfit suggestions.\n\n"
        f"User: {message}"
    )


# ----------------------------
# MAIN CHAT API
# ----------------------------
@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    try:
        message = (payload.message or "").strip()

        email = _sanitize_email(payload.email)

        items = list_wardrobe_for_user(email)

        picked = pick_relevant_items(items, message)

        wardrobe_text = "\n".join([
            f"- {i.get('item_name')} ({i.get('category')}, {i.get('color')})"
            for i in picked
        ])

        prompt = build_prompt(
            message,
            wardrobe_text,
            len(picked) > 0,
        )

        # fallback if gemini missing
        if not gemini_service.is_configured():
            return ChatResponse(
                reply="AI service is not configured."
            )

        text = gemini_service.generate_reply(
            prompt,
            temperature=0.8,
        )

        if not text:
            text = "I could not generate a reply."

        return ChatResponse(reply=text)

    except Exception as e:
        return ChatResponse(
            reply=f"Backend error: {str(e)}"
        )