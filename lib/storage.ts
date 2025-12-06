import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const uploadRoot = process.env.UPLOAD_DIR || '/data/uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type UploadFile = Blob & { name?: string; size: number };

async function ensureUploadDir() {
  await fs.mkdir(uploadRoot, { recursive: true });
}

export async function persistUpload(file: UploadFile, tag: 'resume' | 'jd') {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    throw new Error(`Please upload a valid ${tag === 'resume' ? 'resume' : 'job description'} file.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Each file must be 5 MB or less. Please compress your ${tag === 'resume' ? 'resume' : 'job description'} file.`);
  }

  await ensureUploadDir();

  const originalName = file.name || `${tag}-upload`;
  const extension = originalName.includes('.') ? originalName.split('.').pop() : 'dat';
  const fileName = `${tag}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadRoot, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(filePath, buffer);
  return filePath;
}
