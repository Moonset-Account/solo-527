from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers import pages, api
from app.database import init_db
from app.config import STATIC_DIR, UPLOAD_DIR

app = FastAPI(title="调拨单证据绑定平台")

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(pages.router)
app.include_router(api.router)

@app.on_event("startup")
async def startup_event():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / "sample").mkdir(parents=True, exist_ok=True)
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
