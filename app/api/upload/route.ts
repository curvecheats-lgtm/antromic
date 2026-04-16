import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedExtensions = ['.exe', '.zip'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file type. Only .exe and .zip files are allowed' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, uniqueName);

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${uniqueName}`;
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: uniqueName 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
