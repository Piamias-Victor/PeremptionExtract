import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
    
    // Detect separator: check first 5 lines
    const sampleRows = rows.slice(0, 5);
    const semicolonCount = sampleRows.reduce((acc, row) => acc + (row.match(/;/g) || []).length, 0);
    const commaCount = sampleRows.reduce((acc, row) => acc + (row.match(/,/g) || []).length, 0);
    
    // Default to semicolon if it appears frequently
    const separator = semicolonCount >= sampleRows.length ? ';' : ',';
    console.log(`[DEBUG] Detected separator: '${separator}' (semicolons: ${semicolonCount}, commas: ${commaCount})`);

    let successCount = 0;
    let errorCount = 0;

    // So we process ALL rows, but maybe skip if the first row looks like a header (e.g. contains "EAN" or "Code")
    let startIndex = 0;
    if (rows.length > 0) {
        const firstCols = rows[0].split(separator);
        const firstVal = firstCols[0].replace(/^"|"$/g, '');
        if (isNaN(Number(firstVal)) && (firstVal.toLowerCase().includes('ean') || firstVal.toLowerCase().includes('code'))) {
            startIndex = 1;
        }
    }

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row.trim()) continue;

        let cols = row.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));

        if (cols.length < 4) {
             continue; // Skip invalid rows
        }

        const code13 = cols[0];
        const name = cols[1];
        const stockStr = cols[2];
        let rotationStr = cols[3];

        // Specific fix for comma separator splitting decimal values (e.g. 15,7 -> "15", "7")
        if (separator === ',' && cols.length > 4 && /^\d+$/.test(rotationStr) && /^\d+$/.test(cols[4])) {
             rotationStr = `${rotationStr},${cols[4]}`;
             console.log(`[DEBUG] Reconstructed split rotation: ${rotationStr}`);
        }

        if (!code13 || code13.length < 8) { // Basic validation
             errorCount++;
             continue;
        }

        // Parse numbers
        // Stock: "N/A" -> 0
        let stock = 0;
        if (stockStr && stockStr.toLowerCase() !== 'n/a') {
            stock = parseInt(stockStr.replace(/\s/g, ''), 10);
            if (isNaN(stock)) stock = 0;
        }

        // Rotation: "15,7" -> 15.7, "N/A" -> 0
        let rotation = 0;
        if (rotationStr && rotationStr.toLowerCase() !== 'n/a') {
            const normalized = rotationStr.replace(',', '.').replace(/\s/g, '');
            rotation = parseFloat(normalized);
            console.log(`[DEBUG] Row ${i}: rotationStr="${rotationStr}" -> normalized="${normalized}" -> parsed=${rotation}`);
            if (isNaN(rotation)) rotation = 0;
        }

        try {
            await prisma.catalogProduct.upsert({
                where: { code13 },
                update: {
                    name,
                    stock,
                    rotation,
                    lastUpdated: new Date()
                },
                create: {
                    code13,
                    name,
                    stock,
                    rotation
                }
            });
            successCount++;
        } catch (e) {
            console.error(`Error processing row ${i}:`, e);
            errorCount++;
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Import terminé : ${successCount} produits mis à jour/créés. ${errorCount} erreurs.` 
    });

  } catch (error) {
    console.error('Error uploading catalog:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
