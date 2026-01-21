
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import prisma from './prisma';

interface EmailAttachment {
    filename: string;
    content: Buffer;
    contentType: string;
}

interface FetchedEmail {
    messageId: string;
    subject: string;
    from: string;
    attachments: EmailAttachment[];
    date: Date;
}

export class EmailService {
    private client: ImapFlow;

    constructor() {
        this.client = new ImapFlow({
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(process.env.IMAP_PORT || '993'),
            secure: true,
            auth: {
                user: process.env.IMAP_USER || '',
                pass: process.env.IMAP_PASSWORD || ''
            },
            logger: false
        });
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await this.client.logout();
    }

    async getUnprocessedEmails(): Promise<FetchedEmail[]> {
        const lock = await this.client.getMailboxLock('INBOX');
        const emails: FetchedEmail[] = [];

        try {
            // Search criteria
            const searchSubject = process.env.EMAIL_SEARCH_SUBJECT || 'FACTURE TEST';
            
            // Allow searching from specific sender if configured
            const searchCriteria = {
                subject: searchSubject
            };
            
            // Perform search
            // Note: IMAP search might not be case insensitive depending on server
            const messages = await this.client.fetch(searchCriteria, {
                envelope: true,
                source: true,
                uid: true
            });

            for await (const message of messages) {
                if (!message.envelope) continue;
                const messageId = message.envelope.messageId;
                if (!messageId) continue;
                
                // Check if already processed
                const existing = await prisma.processedEmail.findUnique({
                    where: { messageId }
                });

                if (existing) {
                    continue;
                }

                if (!message.source) continue;
                
                // Parse email source
                const parsed = await simpleParser(message.source);
                
                const validAttachments = parsed.attachments.flatMap(att => {
                    if (att.contentType === 'application/pdf' || att.filename?.toLowerCase().endsWith('.pdf')) {
                         return [{
                             filename: att.filename || `email-attachment-${message.seq}.pdf`,
                             content: att.content,
                             contentType: att.contentType
                         }];
                    }
                    return [];
                });
                
                if (validAttachments.length > 0) {
                     emails.push({
                         messageId,
                         subject: message.envelope.subject || 'No Subject',
                         from: message.envelope.from?.[0]?.address || 'Unknown',
                         date: message.envelope.date || new Date(),
                         attachments: validAttachments
                     });
                }
            }
        } finally {
            lock.release();
        }

        return emails;
    }

    async markAsProcessed(messageId: string, status: 'SUCCESS' | 'FAILED', subject?: string, sender?: string) {
        await prisma.processedEmail.create({
            data: {
                messageId,
                status,
                subject: subject ? subject.substring(0, 255) : null,
                sender: sender ? sender.substring(0, 255) : null
            }
        });
    }
}
