import { db } from './db';

export default async function handler(req: any, res: any) {
  const { query, currentUserId, userId } = req.query;

  try {
    if (userId) {
      // Get specific user
      const { rows } = await db.sql`SELECT * FROM users WHERE id = ${userId}`;
      return res.status(200).json(rows);
    }

    if (query) {
      // Search users excluding self
      // ILIKE for case-insensitive search
      const searchPattern = `%${query}%`;
      const { rows } = await db.sql`
        SELECT * FROM users 
        WHERE username ILIKE ${searchPattern} 
        AND id != ${currentUserId}
        LIMIT 20
      `;
      return res.status(200).json(rows);
    }

    return res.status(200).json([]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}