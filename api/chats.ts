import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // Fetch all chats where the user is a participant
    // AND fetch the last message
    // AND fetch the other participants details
    
    // 1. Get Chat IDs for user
    const { rows: chatRows } = await sql`
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
    // We do this concurrently for performance
    const populatedChats = await Promise.all(chatRows.map(async (chat) => {
      // Get Participants
      const { rows: participants } = await sql`
        SELECT u.id, u.username 
        FROM users u
        JOIN chat_participants cp ON u.id = cp.user_id
        WHERE cp.chat_id = ${chat.id}
      `;

      // Get Last Message
      const { rows: messages } = await sql`
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
        participants_data: participants, // Helper for frontend
        lastMessage
      };
    }));

    return res.status(200).json(populatedChats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }
}