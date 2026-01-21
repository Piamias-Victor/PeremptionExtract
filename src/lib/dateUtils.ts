
import { parse, isValid, differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Attempts to parse various date string formats into a valid Date object.
 * Handles formats like: "MM/YYYY", "DD/MM/YYYY", "MMM YY", etc.
 */
export function parseExpirationDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  const cleanStr = dateStr.trim().replace(/[^a-zA-Z0-9/\-.]/g, ' '); // Keep basic structure

  // Common Formats to try
  const formats = [
    'dd/MM/yyyy',
    'dd/MM/yy',
    'MM/yyyy',
    'MM/yy',
    'yyyy-MM-dd',
    'MMM yy', // "DEC 24"
    'MMM yyyy'
  ];

  for (const fmt of formats) {
    // Use a reference date for missing day (default to end of month usually better for expiration,
    // but start of month is safer for "not expired yet")
    // Let's assume day 1 if missing.
    const parsedDate = parse(cleanStr, fmt, new Date(), { locale: fr });
    
    if (isValid(parsedDate)) {
      // If the format was just Month/Year, date-fns defaults to 1st of month.
      // Often expiration is end of month. For safety in pharma, we might treat it as end of month?
      // Or stick to raw parsing. Let's stick to simple parsing for now.
      return parsedDate;
    }
  }

  return null;
}

export function getDaysRemaining(targetDate: Date): number {
  return differenceInDays(targetDate, new Date());
}

export type UrgencyLevel = 'critical' | 'warning' | 'good' | 'unknown';

export function getUrgencyLevel(date: Date | null): UrgencyLevel {
  if (!date) return 'unknown';
  const days = getDaysRemaining(date);
  
  if (days <= 30) return 'critical'; // Less than a month (or expired)
  if (days <= 90) return 'warning';  // Less than 3 months
  return 'good';
}

export function formatFrenchDate(date: Date | null): string {
    if (!date) return '-';
    return format(date, 'dd MMM yyyy', { locale: fr });
}
