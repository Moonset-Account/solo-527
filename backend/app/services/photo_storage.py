import io
import uuid

import boto3
from botocore.exceptions import ClientError

from app.config import settings


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
    )


def ensure_bucket():
    s3 = get_s3_client()
    try:
        s3.head_bucket(Bucket=settings.S3_BUCKET_NAME)
    except ClientError:
        s3.create_bucket(Bucket=settings.S3_BUCKET_NAME)


def upload_photo(file_data: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    s3 = get_s3_client()
    object_key = f"delivery-photos/{uuid.uuid4()}/{filename}"
    s3.upload_fileobj(
        io.BytesIO(file_data),
        settings.S3_BUCKET_NAME,
        object_key,
        ExtraArgs={"ContentType": content_type},
    )
    return f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{object_key}"


def get_photo_url(object_key: str, expires_in: int = 3600) -> str:
    s3 = get_s3_client()
    try:
        return s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": object_key},
            ExpiresIn=expires_in,
        )
    except ClientError:
        return object_key
