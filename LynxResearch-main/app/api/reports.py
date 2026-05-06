# app/api/reports.py

import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.report import Report
from app.schemas.report import ReportResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{run_id}", response_model=ReportResponse)
async def get_report_metadata(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get report metadata for a completed run."""
    result = await db.execute(
        select(Report).where(Report.run_id == run_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/{run_id}/download")
async def download_report(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Download the PDF report.
    Browser receives it as an attachment → auto-downloads to user's PC.
    """
    result = await db.execute(
        select(Report).where(Report.run_id == run_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not report.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not yet generated")

    pdf_path = Path(report.pdf_path)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on server")

    filename = f"LynxResearch_{str(run_id)[:8]}.pdf"
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{run_id}/markdown")
async def get_report_markdown(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return raw markdown content for frontend preview."""
    result = await db.execute(
        select(Report).where(Report.run_id == run_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {"run_id": str(run_id), "markdown": report.markdown_content}