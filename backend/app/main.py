from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, events, checkpoints, notifications, reports, attachments

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="研学营地安全事件复盘看板 API",
    description="Camp Safety Event Review Dashboard API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(checkpoints.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(attachments.router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
