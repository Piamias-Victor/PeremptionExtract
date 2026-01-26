import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Code is required' },
        { status: 400 }
      );
    }

    // Find products with the same EAN, ordered by most recent first
    // We limit to 5 most recent to avoid massive payloads for common products
    const duplicates = await prisma.product.findMany({
      where: {
        code13: code,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        quantity: true,
        expirationDate: true,
        zone: true,
        operator: true,
        createdAt: true,
        lotNumber: true,
      },
    });

    return NextResponse.json({ success: true, duplicates });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
