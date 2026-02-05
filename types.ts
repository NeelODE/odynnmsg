export interface User {
  id: string;
  username: string;
  // password is internal and not exposed in the UI model generally
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  updatedAt: number;
}

// Extended Chat type for UI consumption (includes full User objects)
export interface PopulatedChat extends Omit<Chat, 'participantIds'> {
  participants: User[];
  otherUser: User; // The user we are chatting with
}

export interface AuthSession {
  user: User;
  token: string;
}
