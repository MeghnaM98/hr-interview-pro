import { NextRequest, NextResponse } from 'next/server';
import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';

const uploadRoot = process.env.UPLOAD_DIR || '/data/uploads';

export async function GET(request: NextRequest) {
  const fileParam = request.nextUrl.searchParams.get('file');

  if (!fileParam) {
    return NextResponse.json({ error: 'Missing file parameter.' }, { status: 400 });
  }

  const safeName = path.basename(fileParam);
  const filePath = path.join(uploadRoot, safeName);

  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }

  const fileStream = createReadStream(filePath);
  const webStream = Readable.toWeb(fileStream) as ReadableStream;
  const ext = path.extname(safeName).toLowerCase();
  const mimeType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${safeName}"`
    }
  });
}
