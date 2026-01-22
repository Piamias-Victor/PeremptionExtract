import PDFParser from 'pdf2json';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/prisma';
import { ExtractedData } from '@/types';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const pdfParser = new PDFParser(null, true);

    return new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (errData: { parserError: Error } | Error) => {
             const error = 'parserError' in errData ? errData.parserError : errData;
             reject(error);
        });
        pdfParser.on("pdfParser_dataReady", () => {
            const rawText = pdfParser.getRawTextContent();
            resolve(rawText);
        });
        pdfParser.parseBuffer(buffer);
    });
}

export async function extractDataFromText(text: string): Promise<ExtractedData | null> {
    if (!text || text.length < 50) return null;

    try {
        const anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
        });

        const prompt = `
        Analyze the following text extracted from a pharmaceutical delivery note or invoice.
        Extract the following information for each product line item:
        - Code 13 (EAN/CIP code, usually 13 digits)
        - Product Name
        - Quantity
        - Expiration Date (Date de péremption)
        - Lot Number (Numéro de lot)
        - Rotation Mensuelle (Monthly rotation)
        - Prix HT BRUT (Price without discount / Prix sans remise)
        - Remise (Discount rate in % / Taux de remise)
        - PU HT NET (Discounted price / Prix remisé)

        Return ONLY valid JSON in the following format:
        {
          "products": [
            {
              "code13": "string or null",
              "name": "string",
              "quantity": "string or number",
              "expirationDate": "string or null",
              "lot": "string or null",
              "rotation_mensuelle": "string or null",
              "prix_sans_remise": "string or null",
              "remise": "string or null",
              "prix_remisee": "string or null"
            }
          ]
        }

        Text to analyze:
        ${text.substring(0, 15000)}
        `;

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 4000,
            temperature: 0,
            system: "You are a data extraction assistant. You output ONLY valid JSON.",
            messages: [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        });

        const contentBlock = msg.content[0];
        if (contentBlock.type === 'text') {
            const textResponse = contentBlock.text;
            const jsonString = textResponse.replace(/```json\n?|\n?```/g, '');
            return JSON.parse(jsonString) as ExtractedData;
        }
        return null;
    } catch (error) {
        console.error("AI Extraction Error:", error);
        throw error;
    }
}

export async function saveInvoiceToDB(filename: string, text: string, data: ExtractedData, zone: string = "DEPOT", operator: string | null = null) {
    if (!data.products || data.products.length === 0) return null;

    return await prisma.invoice.create({
        data: {
        filename: filename,
        rawText: text,
        products: {
            create: data.products.map((p) => ({
            code13: p.code13 || null,
            name: p.name || 'Inconnu',
            quantity: p.quantity ? String(p.quantity) : null,
            expirationDate: p.expirationDate || null,
            lotNumber: p.lot || null, // We map 'lot' from AI to 'lotNumber' in DB
            rotation_mensuelle: p.rotation_mensuelle || null,
            prix_sans_remise: p.prix_sans_remise || null,
            remise: p.remise || null,
            prix_remisee: p.prix_remisee || null,
            zone: zone,
            operator: operator
            }))
        }
        }
    });
}
