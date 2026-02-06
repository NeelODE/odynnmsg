<<<<<<< HEAD
import { db } from './db';
=======
import { sql } from '@vercel/postgres';
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // 1. LAZY INIT: Ensure tables exist
<<<<<<< HEAD
    // We use db.sql`...` instead of just sql`...`
    await db.sql`
=======
    // In a production app, use migrations. Here we do it on login for convenience.
    await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `;
<<<<<<< HEAD
    await db.sql`
=======
    await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `;
<<<<<<< HEAD
    await db.sql`
=======
    await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      CREATE TABLE IF NOT EXISTS chat_participants (
        chat_id UUID REFERENCES chats(id),
        user_id UUID REFERENCES users(id),
        PRIMARY KEY (chat_id, user_id)
      );
    `;
<<<<<<< HEAD
    await db.sql`
=======
    await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID REFERENCES chats(id),
        sender_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `;

    // 2. Login / Register logic
<<<<<<< HEAD
    await db.sql`
=======
    // Try to insert, if exists, get the user
    await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      INSERT INTO users (username) 
      VALUES (${username}) 
      ON CONFLICT (username) DO NOTHING;
    `;

<<<<<<< HEAD
    const { rows } = await db.sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
=======
    const { rows } = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
    const user = rows[0];

    // Convert BigInt to number for JSON response
    const safeUser = {
      ...user,
      created_at: Number(user.created_at) 
    };

    return res.status(200).json(safeUser);
<<<<<<< HEAD
  } catch (error: any) {
    console.error('DB Error:', error);
    return res.status(500).json({ error: 'Database error: ' + error.message });
=======
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
  }
}