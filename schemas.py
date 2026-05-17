"""Shared request/response models for the API."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=3000)
    email: str | None = Field(default=None, max_length=254)


class ChatResponse(BaseModel):
    reply: str
