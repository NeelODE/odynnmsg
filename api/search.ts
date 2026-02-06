<<<<<<< HEAD
import { db } from './db';
=======
import { sql } from '@vercel/postgres';
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64

export default async function handler(req: any, res: any) {
  const { query, currentUserId, userId } = req.query;

  try {
    if (userId) {
      // Get specific user
<<<<<<< HEAD
      const { rows } = await db.sql`SELECT * FROM users WHERE id = ${userId}`;
=======
      const { rows } = await sql`SELECT * FROM users WHERE id = ${userId}`;
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      return res.status(200).json(rows);
    }

    if (query) {
      // Search users excluding self
      // ILIKE for case-insensitive search
      const searchPattern = `%${query}%`;
<<<<<<< HEAD
      const { rows } = await db.sql`
=======
      const { rows } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
        SELECT * FROM users 
        WHERE username ILIKE ${searchPattern} 
        AND id != ${currentUserId}
        LIMIT 20
      `;
      return res.status(200).json(rows);
    }

    return res.status(200).json([]);
<<<<<<< HEAD
  } catch (error: any) {
=======
  } catch (error) {
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
    return res.status(500).json({ error: error.message });
  }
}