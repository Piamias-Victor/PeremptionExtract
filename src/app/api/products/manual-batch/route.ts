import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ManualProductInput {
  code13: string;
  quantity: string;
  expirationDate: string; // YYYY-MM-DD
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products } = body as { products: ManualProductInput[] };

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, message: "No products provided" },
        { status: 400 },
      );
    }

    // 1. Create the container Invoice
    const now = new Date();
    const formattedDate = format(now, "dd/MM/yyyy HH:mm", { locale: fr });
    const invoiceName = `Saisie_Manuelle_${formattedDate}`;

    const invoice = await prisma.invoice.create({
      data: {
        filename: invoiceName,
        uploadDate: now,
        rawText: "Saisie Manuelle",
      },
    });

    // 2. Process products and resolve names
    const productsToCreate = [];

    for (const p of products) {
      let resolvedName = "Produit Inconnu (Manual)";
      let resolvedPrice = null;
      let resolvedPriceRemise = null;

      // Try to find an existing product with this code to copy metadata
      if (p.code13) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            code13: p.code13,
            name: { not: "Produit Inconnu (Manual)" }, // Avoid copying our own unknown placeholder
          },
          orderBy: { invoice: { uploadDate: "desc" } }, // Taking the most recent one
        });

        if (existingProduct) {
          resolvedName = existingProduct.name;
          resolvedPrice = existingProduct.prix_sans_remise;
          resolvedPriceRemise = existingProduct.prix_remisee;
        }
      }

      productsToCreate.push({
        invoiceId: invoice.id,
        code13: p.code13,
        name: resolvedName,
        quantity: p.quantity,
        expirationDate: p.expirationDate, // We store the raw date string from input (YYYY-MM-DD)
        // Copying pricing info if available, otherwise null
        prix_sans_remise: resolvedPrice,
        prix_remisee: resolvedPriceRemise,
        // Manual entry metadata
        lotNumber: "MANUAL",
      });
    }

    // 3. Batch Insert
    await prisma.product.createMany({
      data: productsToCreate,
    });

    return NextResponse.json({
      success: true,
      count: productsToCreate.length,
      invoiceId: invoice.id,
    });
  } catch (error) {
    console.error("Manual batch upload error:", error);
    return NextResponse.json(
      { success: false, message: "Batch creation failed" },
      { status: 500 },
    );
  }
}
