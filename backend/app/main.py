from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth as auth_router, training_plans, checkins, pace_analysis, activities, injury_notes, tasks
from . import tasks as app_tasks
from . import models, auth as auth_module
from sqlalchemy.orm import Session
from .database import get_db
from typing import List

Base.metadata.create_all(bind=engine)

app = FastAPI(title="城市跑团训练打卡平台")


@app.on_event("startup")
def startup_event():
    app_tasks.start_notification_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    app_tasks.stop_notification_scheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(training_plans.router)
app.include_router(checkins.router)
app.include_router(pace_analysis.router)
app.include_router(activities.router)
app.include_router(injury_notes.router)
app.include_router(tasks.router)


@app.get("/")
def root():
    return {"message": "城市跑团训练打卡平台 API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/notifications/status", tags=["notifications"])
def get_notification_status(
    current_user: models.User = Depends(auth_module.allow_coach)
):
    return app_tasks.get_scheduler_status()


@app.post("/api/notifications/retry-all", tags=["notifications"])
def retry_all_failed_notifications(
    current_user: models.User = Depends(auth_module.allow_coach)
):
    app_tasks.retry_failed_notifications()
    return {"message": "Retry triggered"}


@app.get("/api/notifications/", tags=["notifications"])
def list_notifications(
    only_failed: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_module.allow_coach)
):
    query = db.query(models.Notification)
    if only_failed:
        query = query.filter(
            models.Notification.sent_at.is_(None),
            models.Notification.retry_count >= models.Notification.max_retries
        )
    notifications = query.order_by(models.Notification.created_at.desc()).limit(100).all()
    return notifications
