
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

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
