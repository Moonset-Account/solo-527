from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, training_plans, checkins, pace_analysis, activities, injury_notes, tasks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="城市跑团训练打卡平台")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
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
