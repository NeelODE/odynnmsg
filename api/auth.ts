import { sql } from '@vercel/postgres';

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
    // In a production app, use migrations. Here we do it on login for convenience.
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS chat_participants (
        chat_id UUID REFERENCES chats(id),
        user_id UUID REFERENCES users(id),
        PRIMARY KEY (chat_id, user_id)
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID REFERENCES chats(id),
        sender_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `;

    // 2. Login / Register logic
    // Try to insert, if exists, get the user
    await sql`
      INSERT INTO users (username) 
      VALUES (${username}) 
      ON CONFLICT (username) DO NOTHING;
    `;

    const { rows } = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
    const user = rows[0];

    // Convert BigInt to number for JSON response
    const safeUser = {
      ...user,
      created_at: Number(user.created_at) 
    };

    return res.status(200).json(safeUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }
}