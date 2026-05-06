# app/schemas/report.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class ReportResponse(BaseModel):
    id: uuid.UUID
    run_id: uuid.UUID
    word_count: Optional[int] = None
    page_count: Optional[int] = None
    pdf_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    question: str
    conversation_history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    run_id: str