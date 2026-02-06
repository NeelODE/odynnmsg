import { createPool } from '@vercel/postgres';

// Use the specific custom prefix (odynn_URL) if available, otherwise fallback to standard.
// This handles your specific Vercel configuration.
const connectionString = process.env.odynn_URL || process.env.POSTGRES_URL;

export const db = createPool({
  connectionString,
});