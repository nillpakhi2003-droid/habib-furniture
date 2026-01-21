import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    const width = parseInt(searchParams.get('w') || '200');
    const quality = parseInt(searchParams.get('q') || '60');

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Read the image file
    const imagePath = join(process.cwd(), 'public', path);
    const buffer = await readFile(imagePath);

    // Optimize the image
    const optimized = await sharp(buffer)
      .resize(width, width, { fit: 'cover' })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    // Return optimized image with cache headers
    return new NextResponse(optimized, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
