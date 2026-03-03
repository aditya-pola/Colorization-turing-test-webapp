from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routes.session import router as session_router
from .routes.results import router as results_router

BASE_DIR = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Colorization Perception Study", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(session_router)
app.include_router(results_router)

# Static file mounts — order matters: more specific first
app.mount("/images", StaticFiles(directory=str(BASE_DIR / "image_samples_opt")), name="images")
app.mount("/tutorial", StaticFiles(directory=str(BASE_DIR / "tutorial")), name="tutorial")

# Frontend SPA — must be last
frontend_dist = BASE_DIR / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
