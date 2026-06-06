from minio import Minio
from minio.error import S3Error
from typing import Optional, BinaryIO
import uuid
from app.core.config import settings
from app.core.logging import logger


class ObjectStorage:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Bucket {self.bucket} created")
        except S3Error as e:
            logger.error(f"Error checking/creating bucket: {e}")

    def upload_file(self, file_data: BinaryIO, filename: str, content_type: str, folder: str = "attachments") -> str:
        file_ext = filename.split(".")[-1] if "." in filename else ""
        object_name = f"{folder}/{uuid.uuid4()}.{file_ext}" if file_ext else f"{folder}/{uuid.uuid4()}"
        try:
            self.client.put_object(
                self.bucket,
                object_name,
                file_data,
                length=-1,
                part_size=10*1024*1024,
                content_type=content_type
            )
            logger.info(f"File uploaded: {object_name}")
            return object_name
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise

    def get_file_url(self, object_name: str, expires: int = 3600) -> Optional[str]:
        try:
            return self.client.presigned_get_object(self.bucket, object_name, expires=expires)
        except S3Error as e:
            logger.error(f"Error getting file URL: {e}")
            return None

    def delete_file(self, object_name: str) -> bool:
        try:
            self.client.remove_object(self.bucket, object_name)
            logger.info(f"File deleted: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file: {e}")
            return False


storage = ObjectStorage()
