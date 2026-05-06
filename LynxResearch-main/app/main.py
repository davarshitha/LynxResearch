# app/main.py

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.database import init_db, close_db
from app.services.qdrant_service import ensure_collection_exists
from app.api import runs, reports, chat
from app.config import get_settings

# ── Logging setup ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ── Lifespan (startup + shutdown) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on startup and shutdown.
    Creates DB tables, Qdrant collection, report/charts dirs.
    """
    logger.info("🚀 LynxResearch backend starting up...")

    # Initialize DB
    await init_db()

    # Initialize Qdrant collection
    #await ensure_collection_exists()

    # Ensure output directories exist
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    settings.CHARTS_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("✅ All services initialized. Ready to receive requests.")

    yield  # App runs here

    logger.info("🛑 LynxResearch backend shutting down...")
    await close_db()
    logger.info("✅ Shutdown complete.")


# ── App Factory ───────────────────────────────────────────────
app = FastAPI(
    title="LynxResearch API",
    description="Autonomous Multi-Agent Research Report Generator",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # In production: restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routers ───────────────────────────────────────────────────
app.include_router(runs.router)
app.include_router(reports.router)
app.include_router(chat.router)


# ── Health Check ──────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "LynxResearch API",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "LynxResearch API",
        "docs": "/docs",
        "health": "/health",
    }