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
    
    // Detect separator (simple check on first line)
    const firstLine = rows[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    let successCount = 0;
    let errorCount = 0;

    // Skip header? We assume no header or we try to detect if first col is "ean" or similar
    // User said: "On regarde pas les en tete... la premiere colonnes cest ean la seconde nom la troisieme stock et la derniere rtoation"
    // So we process ALL rows, but maybe skip if the first row looks like a header (e.g. contains "EAN" or "Code")
    let startIndex = 0;
    if (rows.length > 0) {
        const firstCols = rows[0].split(separator);
        if (isNaN(Number(firstCols[0])) && firstCols[0].toLowerCase().includes('ean') || firstCols[0].toLowerCase().includes('code')) {
            startIndex = 1;
        }
    }

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const cols = row.split(separator).map(c => c.trim().replace(/^"|"$/g, '')); // verify quotes removal

        if (cols.length < 4) {
            continue; // Skip invalid rows
        }

        const code13 = cols[0];
        const name = cols[1];
        const stockStr = cols[2];
        const rotationStr = cols[3];

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
