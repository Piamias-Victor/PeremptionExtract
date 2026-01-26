
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all products with their parent invoice details
    const products = await prisma.product.findMany({
      include: {
        invoice: {
          select: {
            filename: true,
            uploadDate: true,
          },
        },
      },
      orderBy: {
        invoice: {
            uploadDate: 'desc'
        }
      }
    });

    // Extract unique codes to fetch from catalog efficiently
    const codes = Array.from(new Set(products.map(p => p.code13).filter(Boolean))) as string[];

    // Fetch catalog info
    const catalogItems = await prisma.catalogProduct.findMany({
        where: { code13: { in: codes } }
    });

    // Create a map for fast lookup
    const catalogMap = new Map(catalogItems.map(c => [c.code13, c]));

    // Enrich products with catalog data
    const enrichedProducts = products.map(p => {
        const catalogItem = p.code13 ? catalogMap.get(p.code13) : null;
        return {
            ...p,
            // Use catalog name if available, otherwise fallback to extracted name
            originalName: p.name, // Keep extracted name just in case
            name: catalogItem?.name || p.name, 
            catalogStock: catalogItem?.stock || null,
            catalogRotation: catalogItem?.rotation || null,
            catalogLastUpdated: catalogItem?.lastUpdated || null
        };
    });

    return NextResponse.json(enrichedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
