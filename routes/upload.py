"""Wardrobe image upload: save file + metadata per user."""
from __future__ import annotations

from pathlib import Path
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from config import ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES, UPLOAD_DIR
from db.wardrobe_store import append_upload_record

router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    email: str = Form(default=""),
    category: str = Form(default=""),
    color: str = Form(default=""),
    item_name: str = Form(default=""),
) -> Dict[str, str]:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    stored_name = f"{uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / stored_name
    destination.write_bytes(content)

    append_upload_record(
        stored_name=stored_name,
        original_filename=file.filename or "",
        email=email,
        category=category,
        color=color,
        item_name=item_name,
    )

    return {"filename": stored_name, "message": "Upload successful"}
