# app/api/runs.py

import uuid
import logging
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.run import ResearchRun
from app.models.report import Report
from app.schemas.run import CreateRunRequest, RunStatusResponse, RunListItem
from app.agents.graph import research_graph
from app.agents.state import ResearchState
from app.services.qdrant_service import embed_and_store_documents
from app.services.pdf_builder import build_pdf, estimate_page_count
from app.utils.progress_emitter import emit_progress, progress_event_generator
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/runs", tags=["Research Runs"])


@router.post("/", response_model=RunStatusResponse, status_code=202)
async def create_run(
    request: CreateRunRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    run = ResearchRun(
        topic=request.topic,
        report_style=request.report_style,
        status="pending",
        progress=0,
        current_stage="queued",
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    background_tasks.add_task(
        execute_research_pipeline,
        str(run.id),
        request.topic,
        request.report_style,
    )

    logger.info(f"✅ Run {run.id} | topic={request.topic!r} | style={request.report_style}")
    return run


@router.get("/{run_id}", response_model=RunStatusResponse)
async def get_run_status(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    run = await db.get(ResearchRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/", response_model=list[RunListItem])
async def list_runs(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResearchRun)
        .order_by(ResearchRun.created_at.desc())
        .limit(limit).offset(offset)
    )
    return result.scalars().all()


@router.get("/{run_id}/progress")
async def stream_progress(run_id: uuid.UUID):
    return StreamingResponse(
        progress_event_generator(str(run_id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


async def execute_research_pipeline(
    run_id: str, topic: str, report_style: str
):
    async with AsyncSessionLocal() as db:
        run = await db.get(ResearchRun, uuid.UUID(run_id))
        if not run:
            return
        try:
            run.status = "running"
            run.current_stage = "scout"
            await db.commit()

            initial_state: ResearchState = {
                "run_id":               run_id,
                "topic":                topic,
                "report_style":         report_style,
                "search_queries":       [],
                "urls_to_crawl":        [],
                "scraped_documents":    [],
                "extracted_tables":     [],
                "time_series_data":     [],
                "forecast_results":     [],
                "chart_paths":          [],
                "key_statistics":       [],
                "report_outline":       [],
                "author1_content":      "",
                "author1_last_paragraph": "",
                "author2_content":      "",
                "citations":            [],
                "validated_content":    "",
                "validation_issues":    [],
                "final_markdown":       "",
                "pdf_path":             "",
                "current_stage":        "scout",
                "progress":             0,
                "errors":               [],
            }

            final_state = await research_graph.ainvoke(initial_state)

            await emit_progress(run_id, "embedding", 85,
                                "Embedding documents for RAG chat...")
            run.current_stage = "embedding"
            run.progress = 85
            await db.commit()

            docs = final_state.get("scraped_documents", [])
            if docs:
                await embed_and_store_documents(run_id, docs)

            await emit_progress(run_id, "building_pdf", 90,
                                "Building PDF report...")
            run.current_stage = "building_pdf"
            run.progress = 90
            await db.commit()

            final_markdown = final_state.get("final_markdown", "")
            if not final_markdown:
                raise ValueError("No final markdown content generated")

            pdf_path = await build_pdf(run_id, final_markdown)
            if not pdf_path:
                raise ValueError("PDF generation failed")

            word_count = len(final_markdown.split())
            page_count = estimate_page_count(final_markdown)

            from app.models.report import Report
            report = Report(
                run_id=uuid.UUID(run_id),
                markdown_content=final_markdown,
                pdf_path=pdf_path,
                word_count=word_count,
                page_count=page_count,
            )
            db.add(report)

            run.status = "done"
            run.progress = 100
            run.current_stage = "done"
            run.completed_at = datetime.utcnow()
            await db.commit()

            await emit_progress(run_id, "done", 100,
                                "Research report ready for download!")
            logger.info(f"✅ Run {run_id} complete")

        except Exception as e:
            logger.error(f"❌ Run {run_id} failed: {e}", exc_info=True)
            run.status = "failed"
            run.error_message = str(e)
            run.current_stage = "failed"
            await db.commit()
            await emit_progress(run_id, "failed", 0, f"Pipeline failed: {str(e)}")