import { User, Chat, Message } from '../types';

/**
 * REAL BACKEND SERVICE
 * 
 * This service now communicates with the Vercel Serverless API endpoints 
 * located in the /api directory.
 */

class APIService {
  
  // --- AUTHENTICATION ---

  async login(username: string): Promise<User> {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return await response.json();
  }

  // --- USER DISCOVERY ---

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const params = new URLSearchParams({ query, currentUserId });
    const response = await fetch(`/api/search?${params.toString()}`);
    if (!response.ok) return [];
    return await response.json();
  }

  async getUserById(id: string): Promise<User | undefined> {
    // Not heavily used in current flow, but implemented for completeness
    const response = await fetch(`/api/search?userId=${id}`);
    if (!response.ok) return undefined;
    const users = await response.json();
    return users[0];
  }

  // --- MESSAGING ---

  async getUserChats(userId: string): Promise<Chat[]> {
    const response = await fetch(`/api/chats?userId=${userId}`);
    if (!response.ok) return [];
    return await response.json();
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    const response = await fetch(`/api/messages?chatId=${chatId}`);
    if (!response.ok) return [];
    return await response.json();
  }

  async sendMessage(senderId: string, recipientId: string, content: string): Promise<Message> {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, recipientId, content }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  }

  // --- HYDRATION HELPER ---
  
  // In the real API version, the /api/chats endpoint should ideally return 
  // populated data, but to keep the frontend types consistent with the previous logic:
  async populateChat(chat: Chat, currentUserId: string): Promise<{ participants: User[], otherUser: User }> {
    // The chat object returned from our API will already have 'participants_data' 
    // attached to it via the JOIN query in api/chats.ts
    // We just need to cast it or transform it.
    
    // @ts-ignore - We are relying on the API sending this extra property
    const participants: User[] = chat.participants_data || [];
    
    const otherUser = participants.find(u => u.id !== currentUserId) || participants[0];
    
    return { participants, otherUser };
  }
}

export const mockBackend = new APIService();
