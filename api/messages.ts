<<<<<<< HEAD
import { db } from './db';
=======
import { sql } from '@vercel/postgres';
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { chatId } = req.query;
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });

<<<<<<< HEAD
    const { rows } = await db.sql`
=======
    const { rows } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      SELECT * FROM messages 
      WHERE chat_id = ${chatId} 
      ORDER BY timestamp ASC
    `;

    const cleanRows = rows.map(r => ({
      ...r,
      timestamp: Number(r.timestamp)
    }));

    return res.status(200).json(cleanRows);
  }

  if (req.method === 'POST') {
    const { senderId, recipientId, content } = req.body;
    
<<<<<<< HEAD
    try {
      // 1. Find existing chat between these 2 users
      const { rows: existingChatRows } = await db.sql`
=======
    // We need to determine if this is a new chat or existing chat
    // If we have a chat ID in body, use it. But the frontend send logic currently 
    // passes recipientID. We need to find the chat between these two.

    try {
      // 1. Find existing chat between these 2 users
      // This query looks for a chat_id that has both users as participants
      const { rows: existingChatRows } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
        SELECT cp1.chat_id
        FROM chat_participants cp1
        JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
        WHERE cp1.user_id = ${senderId} AND cp2.user_id = ${recipientId}
        LIMIT 1;
      `;

      let chatId;

      if (existingChatRows.length > 0) {
        chatId = existingChatRows[0].chat_id;
        // Update updated_at
<<<<<<< HEAD
        await db.sql`UPDATE chats SET updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000) WHERE id = ${chatId}`;
      } else {
        // Create new chat
        const { rows: newChat } = await db.sql`
=======
        await sql`UPDATE chats SET updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000) WHERE id = ${chatId}`;
      } else {
        // Create new chat
        const { rows: newChat } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
          INSERT INTO chats (updated_at) VALUES (DEFAULT) RETURNING id
        `;
        chatId = newChat[0].id;

        // Add participants
<<<<<<< HEAD
        await db.sql`INSERT INTO chat_participants (chat_id, user_id) VALUES (${chatId}, ${senderId})`;
        await db.sql`INSERT INTO chat_participants (chat_id, user_id) VALUES (${chatId}, ${recipientId})`;
      }

      // 2. Insert Message
      const { rows: msgRows } = await db.sql`
=======
        await sql`INSERT INTO chat_participants (chat_id, user_id) VALUES (${chatId}, ${senderId})`;
        await sql`INSERT INTO chat_participants (chat_id, user_id) VALUES (${chatId}, ${recipientId})`;
      }

      // 2. Insert Message
      const { rows: msgRows } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
        INSERT INTO messages (chat_id, sender_id, content)
        VALUES (${chatId}, ${senderId}, ${content})
        RETURNING *
      `;

      const newMessage = {
        ...msgRows[0],
        timestamp: Number(msgRows[0].timestamp)
      };

      return res.status(200).json(newMessage);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to send' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}