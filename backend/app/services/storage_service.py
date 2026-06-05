from typing import Optional, IO
from ..config import settings
import uuid
import os
import shutil

try:
    from minio import Minio
    from minio.error import S3Error
    HAS_MINIO = True
except ImportError:
    HAS_MINIO = False


class StorageService:
    def __init__(self):
        self.use_minio = HAS_MINIO and settings.DB_ENGINE != "sqlite"
        self.local_dir = os.path.join(os.getcwd(), "uploaded_files")
        os.makedirs(self.local_dir, exist_ok=True)
        
        if self.use_minio:
            try:
                self.client = Minio(
                    settings.MINIO_ENDPOINT_WITH_PORT,
                    access_key=settings.MINIO_USER,
                    secret_key=settings.MINIO_PASSWORD,
                    secure=settings.MINIO_SECURE
                )
                self.bucket = settings.MINIO_BUCKET
                self._ensure_bucket()
            except Exception:
                self.use_minio = False

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except Exception:
            pass

    def generate_file_name(self, original_name: str) -> str:
        ext = os.path.splitext(original_name)[1]
        return f"{uuid.uuid4().hex}{ext}"

    def upload_file(
        self,
        file_data: IO[bytes],
        file_name: str,
        content_type: str = "application/octet-stream",
        file_size: Optional[int] = None
    ) -> Optional[str]:
        object_name = self.generate_file_name(file_name)
        
        if self.use_minio:
            try:
                if file_size is None:
                    file_data.seek(0, 2)
                    file_size = file_data.tell()
                    file_data.seek(0)
                self.client.put_object(
                    self.bucket, object_name, file_data, file_size,
                    content_type=content_type
                )
                return object_name
            except Exception:
                pass
        
        local_path = os.path.join(self.local_dir, object_name)
        file_data.seek(0)
        with open(local_path, "wb") as f:
            shutil.copyfileobj(file_data, f)
        return f"local://{object_name}"

    def get_file_url(self, object_name: str, expires: int = 3600) -> Optional[str]:
        if self.use_minio and not object_name.startswith("local://"):
            try:
                return self.client.presigned_get_object(
                    self.bucket, object_name, expires=expires
                )
            except Exception:
                return None
        return f"/attachments/stream/{object_name}"

    def delete_file(self, object_name: str) -> bool:
        if self.use_minio and not object_name.startswith("local://"):
            try:
                self.client.remove_object(self.bucket, object_name)
                return True
            except Exception:
                return False
        
        if object_name.startswith("local://"):
            name = object_name.replace("local://", "")
            local_path = os.path.join(self.local_dir, name)
            if os.path.exists(local_path):
                os.remove(local_path)
            return True
        return False

    def file_exists(self, object_name: str) -> bool:
        if self.use_minio and not object_name.startswith("local://"):
            try:
                self.client.stat_object(self.bucket, object_name)
                return True
            except Exception:
                return False
        
        if object_name.startswith("local://"):
            name = object_name.replace("local://", "")
            return os.path.exists(os.path.join(self.local_dir, name))
        return False

    def download_file(self, object_name: str) -> Optional[bytes]:
        if self.use_minio and not object_name.startswith("local://"):
            try:
                response = self.client.get_object(self.bucket, object_name)
                data = response.read()
                response.close()
                response.release_conn()
                return data
            except Exception:
                return None
        
        if object_name.startswith("local://"):
            name = object_name.replace("local://", "")
            local_path = os.path.join(self.local_dir, name)
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    return f.read()
        return None


storage_service = StorageService()
