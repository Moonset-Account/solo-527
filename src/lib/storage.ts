import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET || 'wedding-planner';

export interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

export async function uploadFile(
  file: Buffer | string,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const key = `${folder}/${uuidv4()}-${fileName}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));

  const url = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;

  return {
    url,
    key,
    name: fileName,
    size: typeof file === 'string' ? Buffer.byteLength(file) : file.length,
    type: contentType,
  };
}

export async function getFileUrl(key: string): Promise<string> {
  return `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
}

export async function uploadBase64Image(
  base64Data: string,
  fileName: string,
  folder: string = 'photos'
): Promise<UploadResult> {
  return uploadBase64File(base64Data, fileName, folder);
}

export async function uploadBase64File(
  base64Data: string,
  fileName: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const contentTypeMatch = base64Data.match(/^data:([^;]+);base64,/);
  const contentType = contentTypeMatch?.[1] || 'application/octet-stream';
  const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');
  
  return uploadFile(buffer, fileName, contentType, folder);
}
