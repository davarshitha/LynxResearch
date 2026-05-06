# app/models/__init__.py
# Import all models here so Alembic can discover them for migrations

from app.models.run import ResearchRun
from app.models.document import ScrapedDocument
from app.models.chunk import TextChunk
from app.models.citation import Citation
from app.models.report import Report

__all__ = [
    "ResearchRun",
    "ScrapedDocument",
    "TextChunk",
    "Citation",
    "Report",
]