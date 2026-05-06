# app/api/chat.py

import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, AsyncSessionLocal
from app.models.report import Report
from app.models.run import ResearchRun
from app.models.chat import ChatMessage
from app.schemas.report import ChatRequest, ChatResponse
from app.services.rag_service import chat_with_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["RAG Chat"])


# 🔥 SEND MESSAGE + SAVE
@router.post("/{run_id}", response_model=ChatResponse)
async def chat_with_run_report(
    run_id: uuid.UUID,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    # Validate run
    run = await db.get(ResearchRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status != "done":
        raise HTTPException(
            status_code=400,
            detail=f"Run not complete (status: {run.status})"
        )

    # Validate report
    result = await db.execute(select(Report).where(Report.run_id == run_id))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # 🔥 Generate answer
    answer = await chat_with_report(
        run_id=str(run_id),
        question=request.question,
        conversation_history=request.conversation_history,
    )

    # 🔥 SAVE TO DB
    async with AsyncSessionLocal() as db2:
        db2.add(ChatMessage(
            run_id=run_id,
            role="user",
            message=request.question
        ))

        db2.add(ChatMessage(
            run_id=run_id,
            role="assistant",
            message=answer
        ))

        await db2.commit()

    return ChatResponse(answer=answer, run_id=str(run_id))


# 🔥 LOAD CHAT HISTORY
@router.get("/{run_id}")
async def get_chat_history(run_id: uuid.UUID):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.run_id == run_id)
            .order_by(ChatMessage.created_at)
        )

        messages = result.scalars().all()

        return [
            {
                "role": m.role,
                "content": m.message
            }
            for m in messages
        ]