import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';
import { extractTextFromPDF, extractDataFromText, saveInvoiceToDB } from '@/lib/extraction';

export async function GET() {
    const emailService = new EmailService();
    const results = [];

    try {
        await emailService.connect();
        const emails = await emailService.getUnprocessedEmails();

        for (const email of emails) {
            let processedSuccessfully = false;
            
            for (const attachment of email.attachments) {
                try {
                    // Extract text
                    const text = await extractTextFromPDF(attachment.content);
                    
                    // AI Extraction
                    const data = await extractDataFromText(text);

                    if (data && data.products && data.products.length > 0) {
                        // Save to DB
                        // Save to DB
                        await saveInvoiceToDB(
                            attachment.filename, // Using sanitized filename might be better but for now original is fine
                            text,
                            data
                        );
                         results.push({
                            messageId: email.messageId,
                            filename: attachment.filename,
                            status: 'SAVED',
                            products: data.products.length
                        });
                        processedSuccessfully = true;
                    } else {
                        results.push({
                            messageId: email.messageId,
                            filename: attachment.filename,
                            status: 'SKIPPED_NO_DATA'
                        });
                    }

                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`Error processing attachment ${attachment.filename}:`, error);
                    results.push({
                        messageId: email.messageId,
                        filename: attachment.filename,
                        status: 'ERROR',
                        error: errorMessage
                    });
                }
            }

            // Mark email as processed regardless of individual attachment success 
            // to avoid infinite retry loops on bad files.
            // We record status based on whether at least one attachment was useful or not.
            await emailService.markAsProcessed(
                email.messageId, 
                processedSuccessfully ? 'SUCCESS' : 'FAILED',
                email.subject,
                email.from
            );
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Email Sync Error:', error);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    } finally {
        await emailService.disconnect();
    }

    return NextResponse.json({ 
        success: true, 
        count: results.length,
        results 
    });
}
