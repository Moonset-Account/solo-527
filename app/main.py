from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.models import *
from app.routers import schedule, appointment, checkin, waitlist, refund, pricing, config, stats, pages


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="口腔诊所排班核销系统", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(schedule.router, prefix="/api/schedule", tags=["排班"])
app.include_router(appointment.router, prefix="/api/appointment", tags=["预约"])
app.include_router(checkin.router, prefix="/api/checkin", tags=["核销"])
app.include_router(waitlist.router, prefix="/api/waitlist", tags=["候补"])
app.include_router(refund.router, prefix="/api/refund", tags=["退款"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["价格规则"])
app.include_router(config.router, prefix="/api/config", tags=["配置"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计"])
app.include_router(pages.router, tags=["页面"])
