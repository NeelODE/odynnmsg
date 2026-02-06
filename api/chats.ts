<<<<<<< HEAD
import { db } from './db';
=======
import { sql } from '@vercel/postgres';
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64

export default async function handler(req: any, res: any) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
<<<<<<< HEAD
    // 1. Get Chat IDs for user
    const { rows: chatRows } = await db.sql`
=======
    // Fetch all chats where the user is a participant
    // AND fetch the last message
    // AND fetch the other participants details
    
    // 1. Get Chat IDs for user
    const { rows: chatRows } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
      SELECT c.id, c.updated_at
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ${userId}
      ORDER BY c.updated_at DESC
    `;

    // If no chats, return empty
    if (chatRows.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Hydrate chats with participants and last message
<<<<<<< HEAD
    const populatedChats = await Promise.all(chatRows.map(async (chat) => {
      // Get Participants
      const { rows: participants } = await db.sql`
=======
    // We do this concurrently for performance
    const populatedChats = await Promise.all(chatRows.map(async (chat) => {
      // Get Participants
      const { rows: participants } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
        SELECT u.id, u.username 
        FROM users u
        JOIN chat_participants cp ON u.id = cp.user_id
        WHERE cp.chat_id = ${chat.id}
      `;

      // Get Last Message
<<<<<<< HEAD
      const { rows: messages } = await db.sql`
=======
      const { rows: messages } = await sql`
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
        SELECT * FROM messages 
        WHERE chat_id = ${chat.id}
        ORDER BY timestamp DESC
        LIMIT 1
      `;
      
      const lastMessage = messages[0] ? {
        ...messages[0],
        timestamp: Number(messages[0].timestamp)
      } : undefined;

      return {
        id: chat.id,
        updatedAt: Number(chat.updated_at),
        participantIds: participants.map(p => p.id),
<<<<<<< HEAD
        participants_data: participants,
=======
        participants_data: participants, // Helper for frontend
>>>>>>> 036f64750f099606a8312f78b51df790b836ba64
        lastMessage
      };
    }));

    return res.status(200).json(populatedChats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }
}