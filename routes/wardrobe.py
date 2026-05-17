"""Read wardrobe metadata for the logged-in user (by email)."""
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Query

from db.wardrobe_store import list_wardrobe_for_user

router = APIRouter(tags=["wardrobe"])


@router.get("/wardrobe")
def get_wardrobe(email: str = Query(..., min_length=1, description="User email (same as client auth)")) -> Dict[str, Any]:
    items: List[Dict[str, Any]] = list_wardrobe_for_user(email)
    return {"items": items, "count": len(items)}
