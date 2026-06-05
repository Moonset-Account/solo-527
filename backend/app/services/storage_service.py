from minio import Minio
from minio.error import S3Error
from typing import Optional, IO
from ..config import settings
import uuid
import os


class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT_WITH_PORT,
            access_key=settings.MINIO_USER,
            secret_key=settings.MINIO_PASSWORD,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error:
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
        try:
            object_name = self.generate_file_name(file_name)
            if file_size is None:
                file_data.seek(0, 2)
                file_size = file_data.tell()
                file_data.seek(0)
            self.client.put_object(
                self.bucket,
                object_name,
                file_data,
                file_size,
                content_type=content_type
            )
            return object_name
        except S3Error:
            return None

    def get_file_url(self, object_name: str, expires: int = 3600) -> Optional[str]:
        try:
            return self.client.presigned_get_object(
                self.bucket, object_name, expires=expires
            )
        except S3Error:
            return None

    def delete_file(self, object_name: str) -> bool:
        try:
            self.client.remove_object(self.bucket, object_name)
            return True
        except S3Error:
            return False

    def file_exists(self, object_name: str) -> bool:
        try:
            self.client.stat_object(self.bucket, object_name)
            return True
        except S3Error:
            return False

    def download_file(self, object_name: str) -> Optional[bytes]:
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error:
            return None


storage_service = StorageService()
