import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()
os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(title="家电维修调度看板", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

from app.routers import pages, orders, technicians, dispatch, reviews

app.include_router(pages.router)
app.include_router(orders.router)
app.include_router(technicians.router)
app.include_router(dispatch.router)
app.include_router(reviews.router)


@app.get("/health")
def health():
    return {"status": "ok"}
