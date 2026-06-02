"""Wardrobe image upload: save file + metadata per user."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from config import ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES, UPLOAD_DIR
from db.wardrobe_store import append_upload_record

router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    email: str = Form(default=""),
    category: str = Form(default=""),
    color: str = Form(default=""),
    item_name: str = Form(default=""),
) -> Dict[str, Any]:
    if not email or not email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    stored_name = f"{uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / stored_name
    destination.write_bytes(content)

    record = append_upload_record(
        stored_name=stored_name,
        original_filename=file.filename or "",
        email=email,
        category=category,
        color=color,
        item_name=item_name or (file.filename or ""),
    )

    image_url = f"{request.url.scheme}://{request.url.hostname}:{request.url.port}/uploads/{stored_name}"
    now = datetime.now(timezone.utc).isoformat()

    return {
        "id": record.get("id", ""),
        "user_id": email,
        "image_url": image_url,
        "name": record.get("item_name") or record.get("original_filename") or "",
        "category": record.get("category") or "",
        "subcategory": "",
        "colors": [record.get("color")] if record.get("color") else [],
        "primary_color": record.get("primary_color") or record.get("color") or "",
        "pattern": "",
        "style": record.get("style") or "",
        "aesthetic": record.get("aesthetic") or "",
        "seasons": [],
        "occasions": record.get("occasions", []),
        "gender": "",
        "ai_description": record.get("ai_description") or "",
        "ai_analyzed": record.get("ai_analyzed", False),
        "worn_count": int(record.get("worn_count", 0)),
        "last_worn_at": None,
        "is_favorite": False,
        "created_at": now,
    }
