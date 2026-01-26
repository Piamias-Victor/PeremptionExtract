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
    const { products, customName, zone, operator } = body as { 
        products: ManualProductInput[], 
        customName?: string, 
        zone?: string,
        operator?: string 
    };

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, message: "No products provided" },
        { status: 400 },
      );
    }
    
    // Validate operator requirement (server-side check as backup)
    if (!operator) {
         return NextResponse.json(
            { success: false, message: "Operator is required" },
            { status: 400 },
          );
    }

    // 1. Create the container Invoice
    const now = new Date();
    const formattedDate = format(now, "dd/MM/yyyy HH:mm", { locale: fr });
    
    // Use custom name if provided, otherwise default format
    const invoiceName = customName?.trim() 
      ? customName 
      : `Saisie_Manuelle_${formattedDate}`;

    const invoice = await prisma.invoice.create({
      data: {
        filename: invoiceName,
        uploadDate: now,
        rawText: "Saisie Manuelle",
      },
    });

    // 2. Process products and resolve names
    // 2. Process products and resolve names in PARALLEL
    const targetZone = zone || "DEPOT"; // Default to DEPOT if not specified
    const productsToCreate = await Promise.all(products.map(async (p) => {
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

      return {
        invoiceId: invoice.id,
        code13: p.code13,
        name: resolvedName,
        quantity: p.quantity,
        expirationDate: p.expirationDate, 
        prix_sans_remise: resolvedPrice,
        prix_remisee: resolvedPriceRemise,
        lotNumber: "MANUAL",
        zone: targetZone,
        operator: operator,
      };
    }));

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
