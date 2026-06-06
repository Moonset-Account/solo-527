from pathlib import Path
from app.config import ALLOWED_FILE_TYPES, MAX_FILE_SIZE

def validate_file(filename: str, file_size: int, attachment_type: str) -> tuple[bool, str]:
    if file_size > MAX_FILE_SIZE:
        return False, f"文件大小超过限制，最大允许 {MAX_FILE_SIZE // 1024 // 1024}MB"
    
    suffix = Path(filename).suffix.lower()
    allowed_extensions = ALLOWED_FILE_TYPES.get(attachment_type, [])
    
    if not allowed_extensions:
        return False, "未知的附件类型"
    
    if suffix not in allowed_extensions:
        ext_list = ", ".join(allowed_extensions)
        return False, f"文件类型不允许，仅支持 {ext_list}"
    
    return True, ""

def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()
