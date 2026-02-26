/**
 * Ticket categories for support tickets.
 * Matches database schema: tickets.category ENUM
 */
export const TICKET_CATEGORIES = [
  'Technical Support',
  'Billing',
  'Feature Request',
  'Bug Report',
  'Account Issue',
  'General Inquiry',
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
