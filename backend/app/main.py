from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .api import (
    plots,
    varieties,
    batches,
    environment,
    sorting_orders,
    machine_reservations,
    farm_records,
    todos,
    dashboard,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="农事溯源台 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plots.router, prefix="/api")
app.include_router(varieties.router, prefix="/api")
app.include_router(batches.router, prefix="/api")
app.include_router(environment.router, prefix="/api")
app.include_router(sorting_orders.router, prefix="/api")
app.include_router(machine_reservations.router, prefix="/api")
app.include_router(farm_records.router, prefix="/api")
app.include_router(todos.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "农事溯源台 API 服务运行中"}
