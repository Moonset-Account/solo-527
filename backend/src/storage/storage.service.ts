import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  async onModuleInit() {
    this.bucketName = process.env.MINIO_BUCKET || 'travel-quote';

    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' created`);
      } else {
        this.logger.log(`Bucket '${this.bucketName}' already exists`);
      }

      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/public/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      this.logger.log('Bucket policy set for public access');
    } catch (error) {
      this.logger.warn('MinIO initialization failed, using local fallback:', error.message);
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    objectName: string,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      const metaData = {
        'Content-Type': contentType,
      };

      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        buffer,
        buffer.length,
        metaData,
      );

      this.logger.log(`File uploaded: ${objectName}`);
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error('Upload failed, using local fallback:', error);
      return this.getLocalFallbackUrl(objectName);
    }
  }

  async uploadStream(
    stream: Readable,
    objectName: string,
    size: number,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      const metaData = {
        'Content-Type': contentType,
      };

      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        stream,
        size,
        metaData,
      );

      this.logger.log(`Stream uploaded: ${objectName}`);
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error('Stream upload failed:', error);
      throw error;
    }
  }

  async uploadFile(
    filePath: string,
    objectName: string,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      const metaData = {
        'Content-Type': contentType,
      };

      await this.minioClient.fPutObject(
        this.bucketName,
        objectName,
        filePath,
        metaData,
      );

      this.logger.log(`File uploaded from path: ${objectName}`);
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw error;
    }
  }

  async getFile(objectName: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(this.bucketName, objectName);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error('Get file failed:', error);
      throw error;
    }
  }

  async getFileStream(objectName: string): Promise<Readable> {
    try {
      return await this.minioClient.getObject(this.bucketName, objectName);
    } catch (error) {
      this.logger.error('Get file stream failed:', error);
      throw error;
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`File deleted: ${objectName}`);
    } catch (error) {
      this.logger.error('Delete file failed:', error);
      throw error;
    }
  }

  async deleteFiles(objectNames: string[]): Promise<void> {
    try {
      await this.minioClient.removeObjects(this.bucketName, objectNames);
      this.logger.log(`Files deleted: ${objectNames.length}`);
    } catch (error) {
      this.logger.error('Delete files failed:', error);
      throw error;
    }
  }

  async presignedGetObject(objectName: string, expires: number = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(this.bucketName, objectName, expires);
    } catch (error) {
      this.logger.error('Presigned URL generation failed:', error);
      return this.getFileUrl(objectName);
    }
  }

  getFileUrl(objectName: string): string {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${objectName}`;
  }

  private getLocalFallbackUrl(objectName: string): string {
    return `/uploads/${objectName}`;
  }

  async listObjects(prefix?: string): Promise<Minio.BucketItem[]> {
    try {
      const items: Minio.BucketItem[] = [];
      const stream = this.minioClient.listObjectsV2(this.bucketName, prefix, true);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => items.push(obj));
        stream.on('end', () => resolve(items));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error('List objects failed:', error);
      return [];
    }
  }
}
