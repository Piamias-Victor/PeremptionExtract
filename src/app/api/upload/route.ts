import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { extractTextFromPDF, extractDataFromText, saveInvoiceToDB } from '@/lib/extraction';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to public/uploads
  const uploadDir = path.join(process.cwd(), 'public/uploads'); 
  
  // Ensure directory exists
  try {
      await mkdir(uploadDir, { recursive: true });
  } catch {
      // Ignore if exists
  }
  
  // Sanitize filename
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = path.join(uploadDir, sanitizedFilename);
  
  try {
    await writeFile(filePath, buffer);

    let text = '';
    let extractedData = null;

    if (file.type === 'application/pdf') {
       try {
        text = await extractTextFromPDF(buffer);
        extractedData = await extractDataFromText(text);

        if (extractedData) {
            await saveInvoiceToDB(sanitizedFilename, text, extractedData);
        }

      } catch (error) {
        console.error('Processing Error:', error);
        // We continue to return success for the upload even if extraction fails partially
      }
    }

    return NextResponse.json({ 
        success: true, 
        url: `/uploads/${sanitizedFilename}`,
        filename: sanitizedFilename,
        text: text,
        data: extractedData
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
