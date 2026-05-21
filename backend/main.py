from fastapi import FastAPI, Request
import traceback
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.api.v1.endpoints import auth, users, gms, notifications, reports, objectives, health, tracking, articles, complaints, leave_requests, export, stats, session, events, documents, upload, detection
from app import models
from app.db.session import engine, init_db
from app.models import Base
import os
from fastapi.staticfiles import StaticFiles
import time
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter
from app.db import indexes
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background scheduler
    try:
        from app.core.scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        print(f"Scheduler failed to start: {e}")
    
    yield

app = FastAPI(
    title="Welcome to MerchandisingTeam App",
    description="this is Backend API for MerchandisingTeam App",
    version="1.0.0",
    lifespan=lifespan
)


from app.core.config import settings as _cfg

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # Set to False when using allow_origins=["*"] for better compatibility
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    import traceback as tb
    start = time.time()
    auth_header = request.headers.get("Authorization", "No Header")
    try:
        response = await call_next(request)
    except Exception as exc:
        print(f"[MIDDLEWARE EXCEPTION] {type(exc).__name__}: {exc}")
        tb.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "type": type(exc).__name__},
        )
    process_time_ms = (time.time() - start) * 1000
    response.headers["X-Process-Time-ms"] = f"{process_time_ms:.2f}"
    print(f"[DEBUG] {request.method} {request.url.path} - Status: {response.status_code} - Auth: {auth_header[:20]}...")
    return response


os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler) # type: ignore

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"message": "Not Found"})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"[VALIDATION ERROR] {request.method} {request.url}")
    print(f"Detail: {exc.errors()}")
    print(f"Body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(await request.body())},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[GLOBAL ERROR] {request.method} {request.url}")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": str(exc), "type": type(exc).__name__})

app.include_router(auth.router,          prefix="/api/auth",           tags=["auth"])
app.include_router(users.router,         prefix="/api/users",          tags=["users"])
app.include_router(gms.router,           prefix="/api/gms",            tags=["gms"])
app.include_router(notifications.router, prefix="/api/notifications",  tags=["notifications"])
app.include_router(reports.router,       prefix="/api/reports",        tags=["reports"])
app.include_router(health.router,                                      tags=["health"])
app.include_router(objectives.router,    prefix="/api/objectives",     tags=["objectives"])
app.include_router(tracking.router,      prefix="/api/tracking",       tags=["tracking"])
app.include_router(articles.router,      prefix="/api/articles",       tags=["articles"])
app.include_router(complaints.router,    prefix="/api/complaints",     tags=["complaints"])
app.include_router(leave_requests.router,prefix="/api/leave-requests", tags=["leave"])
app.include_router(export.router,        prefix="/api/export",         tags=["exports"])
app.include_router(stats.router,         prefix="/api/stats",          tags=["stats"])
app.include_router(session.router,       prefix="/api/session",        tags=["session"])
app.include_router(events.router,        prefix="/api/events",         tags=["events"])
app.include_router(documents.router,     prefix="/api/documents",      tags=["documents"])
app.include_router(upload.router,        prefix="/api/upload",         tags=["upload"])
app.include_router(detection.router,     prefix="/api/detection",      tags=["detection"])

@app.get("/")
def read_root():
    return {"message": "Welcome to MerchandisingTeam App Backend API ,"
    " I'm here to help you manage your Business"}

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
