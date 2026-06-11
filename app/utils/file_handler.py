import os
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from app.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".gif", ".txt", ".zip"}
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE


def allowed_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


def generate_filename(original_name: str) -> str:
    ext = get_file_extension(original_name)
    return f"{uuid.uuid4().hex}{ext}"


def get_upload_dir() -> str:
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


async def save_upload_file(file: UploadFile, sub_dir: Optional[str] = None) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型。允许的类型: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    content = await file.read()
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制。最大允许: {format_file_size(MAX_FILE_SIZE)}"
        )
    
    upload_dir = get_upload_dir()
    if sub_dir:
        upload_dir = os.path.join(upload_dir, sub_dir)
        os.makedirs(upload_dir, exist_ok=True)
    
    filename = generate_filename(file.filename)
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    relative_path = os.path.join(sub_dir or "", filename) if sub_dir else filename
    
    return {
        "filename": filename,
        "original_name": file.filename,
        "file_type": file.content_type or "application/octet-stream",
        "file_size": len(content),
        "relative_path": relative_path,
        "full_path": file_path
    }


def delete_file(filename: str, sub_dir: Optional[str] = None) -> bool:
    try:
        upload_dir = get_upload_dir()
        if sub_dir:
            upload_dir = os.path.join(upload_dir, sub_dir)
        file_path = os.path.join(upload_dir, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False


def get_file_path(filename: str, sub_dir: Optional[str] = None) -> str:
    upload_dir = get_upload_dir()
    if sub_dir:
        upload_dir = os.path.join(upload_dir, sub_dir)
    return os.path.join(upload_dir, filename)
