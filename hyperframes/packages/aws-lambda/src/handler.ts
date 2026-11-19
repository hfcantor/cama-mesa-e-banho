/**
 * AWS Lambda handler (container image deployment, see Dockerfile).
 *
 * Event (direct invoke, Step Functions, or API Gateway/Function URL JSON body):
 *   { "project": "s3://bucket/projects/demo/" | "s3://bucket/demo.zip",
 *     "output":  "s3://bucket/renders/demo.mp4",
 *     "options": { "quality": "standard", "width": 1920 } }
 *
 * Recommended function settings: 10 GB memory (≈6 vCPU), 15 min timeout,
 * ephemeral storage ≥ 2 GB. Long videos should be split with options.range
 * across several invocations and joined (FFmpeg concat) afterwards.
 */
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { cloudRender, fileStorage, validateRequest, type StorageAdapter } from '@hfr/cloud-common';

let client: S3Client | null = null;
const s3 = () => (client ??= new S3Client({}));

export const s3Storage: StorageAdapter = {
  scheme: 's3',
  async list(bucket, prefix) {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const r = await s3().send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
      for (const o of r.Contents ?? []) if (o.Key && !o.Key.endsWith('/')) keys.push(o.Key.slice(prefix.length));
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    return keys;
  },
  async download(bucket, key, dest) {
    const r = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    await mkdir(path.dirname(dest), { recursive: true });
    await pipeline(r.Body as Readable, createWriteStream(dest));
  },
  async upload(file, bucket, key, contentType) {
    const { size } = await stat(file);
    await s3().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: createReadStream(file), ContentLength: size, ContentType: contentType }));
  },
};

interface ApiGatewayEvent { body?: string; isBase64Encoded?: boolean; requestContext?: unknown }

export async function handler(event: unknown): Promise<unknown> {
  const isHttp = typeof event === 'object' && event !== null && 'requestContext' in event;
  try {
    let body: unknown = event;
    if (isHttp) {
      const e = event as ApiGatewayEvent;
      body = JSON.parse(e.isBase64Encoded ? Buffer.from(e.body ?? '', 'base64').toString('utf8') : e.body ?? '{}');
    }
    const req = validateRequest(body);
    // file:// is only allowed when explicitly enabled (local testing)
    const adapters = process.env.HFR_ALLOW_FILE_STORAGE === '1' ? [s3Storage, fileStorage] : [s3Storage];
    const res = await cloudRender(req, adapters, (m) => console.log(`[hfr] ${m}`));
    return isHttp ? { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(res) } : res;
  } catch (e) {
    console.error('[hfr] render failed', e);
    if (isHttp) return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: (e as Error).message }) };
    throw e;
  }
}
