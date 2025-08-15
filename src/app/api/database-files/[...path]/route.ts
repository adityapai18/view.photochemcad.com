import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), 'src', 'database', ...params.path);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.tif':
      case '.tiff':
        contentType = 'image/tiff';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.cdx':
        contentType = 'application/octet-stream';
        break;
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving database file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
