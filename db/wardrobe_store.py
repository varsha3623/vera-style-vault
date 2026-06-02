"""Per-user wardrobe metadata (uploaded images) stored as JSON."""
from __future__ import annotations
from database import wardrobe_collection
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from config import BASE_DIR, METADATA_FILE, UPLOAD_DIR


def normalize_user_id(email: str | None) -> str:
    if not email or not str(email).strip():
        return ""
    return str(email).strip().lower()


def ensure_storage() -> None:
    METADATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    if not METADATA_FILE.exists():
        METADATA_FILE.write_text("[]", encoding="utf-8")
    _migrate_legacy_metadata_if_needed()


def _migrate_legacy_metadata_if_needed() -> None:
    legacy = BASE_DIR / "wardrobe_metadata.json"
    if not legacy.exists():
        return
    try:
        current = load_metadata()
        if current:
            legacy.rename(BASE_DIR / "wardrobe_metadata.json.bak")
            return

        old_data = json.loads(legacy.read_text(encoding="utf-8"))
        if not isinstance(old_data, list):
            legacy.rename(BASE_DIR / "wardrobe_metadata.json.bak")
            return

        fixed: List[Dict[str, Any]] = []
        for row in old_data:
            if not isinstance(row, dict):
                continue
            email = normalize_user_id(row.get("email"))
            fixed.append({**row, "email": email})
        save_metadata(fixed)
        legacy.rename(BASE_DIR / "wardrobe_metadata.json.migrated")
    except OSError:
        pass


def load_metadata() -> List[Dict[str, Any]]:
    try:
        data = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_metadata(records: List[Dict[str, Any]]) -> None:
    METADATA_FILE.write_text(json.dumps(records, indent=2), encoding="utf-8")


def append_upload_record(
    *,
    stored_name: str,
    original_filename: str,
    email: str,
    category: str,
    color: str,
    item_name: str,
):
    user_id = normalize_user_id(email)

    record = {
        "filename": stored_name,
        "original_filename": original_filename,
        "email": user_id,
        "category": category.strip(),
        "color": color.strip(),
        "item_name": item_name.strip(),
        "ai_analyzed": False,
        "ai_description": "",
        "worn_count": 0,
        "occasions": [],
        "style": "",
        "primary_color": color.strip() or None,
        "aesthetic": "",
    }

    result = wardrobe_collection.insert_one(record)
    record["id"] = str(result.inserted_id)
    return record


def _normalize_wardrobe_item(item: Dict[str, Any]) -> Dict[str, Any]:
    image_url = item.get("image_url")
    if not image_url and item.get("filename"):
        image_url = f"/uploads/{item['filename']}"

    return {
        "id": str(item.get("_id") or item.get("id") or ""),
        "image_url": image_url,
        "imageUrl": image_url,
        "title": item.get("item_name") or item.get("original_filename") or "",
        "name": item.get("item_name") or item.get("original_filename") or "",
        "description": item.get("ai_description") or "",
        "category": item.get("category") or "",
        "created_at": item.get("created_at") or item.get("createdAt") or "",
        "createdAt": item.get("created_at") or item.get("createdAt") or "",
        "ai_analyzed": bool(item.get("ai_analyzed", False)),
        "ai_description": item.get("ai_description") or "",
        "worn_count": int(item.get("worn_count", 0)),
        "occasions": item.get("occasions") or [],
        "style": item.get("style") or "",
        "primary_color": item.get("primary_color") or item.get("color") or "",
        "aesthetic": item.get("aesthetic") or "",
        "color": item.get("color") or "",
    }


def list_wardrobe_for_user(email: str | None):
    user_id = normalize_user_id(email)

    if not user_id:
        return []

    items = list(
        wardrobe_collection.find(
            {"email": user_id}
        )
    )

    return [_normalize_wardrobe_item(item) for item in items]

def wardrobe_summary_for_email(email: Optional[str]) -> str:
    items = list_wardrobe_for_user(email)
    if not items:
        return "No wardrobe uploaded yet."

    lines: List[str] = []
    for item in items[-20:]:
        part = item.get("category") or "item"
        color = item.get("color") or "unknown color"
        name = item.get("item_name") or "unnamed"
        lines.append(f"- {name} ({part}, {color})")
    return "\n".join(lines)


def find_matching_items(email: Optional[str], keyword: str) -> List[Dict[str, Any]]:
    """Items whose category, name, or color contains keyword."""
    items = list_wardrobe_for_user(email)
    kw = (keyword or "").lower()
    if not kw:
        return items
    filtered: List[Dict[str, Any]] = []
    for item in items:
        category = (item.get("category") or "").lower()
        name = (item.get("item_name") or "").lower()
        color = (item.get("color") or "").lower()
        if kw in category or kw in name or kw in color:
            filtered.append(item)
    return filtered
