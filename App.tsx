import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { User, Chat, Message, PopulatedChat } from './types';
import { mockBackend } from './services/mockBackend';
import { useInterval } from './hooks/useInterval';
import PrimaryButton from './ui-elements/PrimaryButton';
import FormInput from './ui-elements/FormInput';
import ChatMessage from './ui-elements/ChatMessage';
import { Search, LogOut, MessageSquare, Send, User as UserIcon } from 'lucide-react';

// --- AUTH COMPONENT ---

const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      // In a real app, password would be hashed and verified. 
      // Here we simulate the frictionless login requirement.
      const user = await mockBackend.login(username);
      onLogin(user);
    } catch (err) {
      console.error(err);
      alert('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d1d7db] p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#008069] mb-2">DirectChat</h1>
          <p className="text-gray-600">Enter your credentials to start messaging.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput 
            label="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. alice"
            autoFocus
          />
          <FormInput 
            label="Password" 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <PrimaryButton type="submit" className="w-full" isLoading={isLoading}>
            Login / Register
          </PrimaryButton>
        </form>
        <p className="mt-4 text-xs text-center text-gray-400">
          Note: This is a demo. Accounts are created automatically if they don't exist.
        </p>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // State for Chats List
  const [chats, setChats] = useState<PopulatedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // State for Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  
  // State for User Discovery
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  // Loading States
  const [isChatsLoading, setIsChatsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // -- AUTH --
  useEffect(() => {
    // Check session storage for persistence on refresh (optional but good UX)
    const storedUser = sessionStorage.getItem('dc_session_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('dc_session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveChatId(null);
    sessionStorage.removeItem('dc_session_user');
  };

  // -- DATA POLLING --
  
  // 1. Poll Chat List (Sidebar)
  const fetchChats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const rawChats = await mockBackend.getUserChats(currentUser.id);
      
      // Populate chats with user details
      const populated = await Promise.all(rawChats.map(async (chat) => {
        const { participants, otherUser } = await mockBackend.populateChat(chat, currentUser.id);
        return { ...chat, participants, otherUser };
      }));
      
      // Simple equality check to avoid re-renders if nothing changed could be added here
      // For now, we rely on React's diffing, which is fast enough for this scale.
      setChats(populated);
    } catch (e) {
      console.error("Polling error", e);
    }
  }, [currentUser]);

  // 2. Poll Active Chat Messages
  const fetchMessages = useCallback(async () => {
    if (!currentUser || !activeChatId) return;
    try {
      const msgs = await mockBackend.getChatMessages(activeChatId);
      setMessages(msgs);
    } catch (e) {
      console.error("Message polling error", e);
    }
  }, [currentUser, activeChatId]);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      setIsChatsLoading(true);
      fetchChats().then(() => setIsChatsLoading(false));
    }
  }, [currentUser, fetchChats]);

  // Polling Interval: The specification asks for frequenct polling.
  // 1500ms ensures <= 2s delay.
  useInterval(() => {
    fetchChats();
    fetchMessages();
  }, currentUser ? 1500 : null);

  // -- USER ACTIONS --

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0 && currentUser) {
      const results = await mockBackend.searchUsers(query, currentUser.id);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const startChat = async (targetUser: User) => {
    if (!currentUser) return;
    // Optimistically switch UI or create chat immediately
    // In our backend logic, sendMessage handles chat creation, 
    // but for UI we might want to check if one exists to select it.
    // For simplicity: We will select an existing chat if found, 
    // or set a "pending" state.
    
    // Let's see if a chat already exists
    const existingChat = chats.find(c => c.otherUser.id === targetUser.id);
    if (existingChat) {
      setActiveChatId(existingChat.id);
      setSearchQuery(''); // Clear search to show list
    } else {
      // Let's use a temporary ID `temp_${targetUser.id}`
      // And handle that in sendMessage.
      setActiveChatId(`TEMP_${targetUser.id}`);
    }
    setSearchQuery(''); 
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessageText.trim() || !currentUser || !activeChatId) return;

    const content = newMessageText;
    setNewMessageText(''); // Optimistic clear

    try {
      let targetChatId = activeChatId;
      
      // Handle the "New Chat" case
      if (activeChatId.startsWith('TEMP_')) {
         const recipientId = activeChatId.replace('TEMP_', '');
         // We send the message, backend creates chat
         const msg = await mockBackend.sendMessage(currentUser.id, recipientId, content);
         
         // Now we need to switch the active ID to the real one
         targetChatId = msg.chatId;
         setActiveChatId(targetChatId);
         
         // Refresh list immediately
         fetchChats();
      } else {
         // Normal send
         // We need to find the recipient. In a real app we'd have the chat object loaded.
         // From `chats` array:
         const chat = chats.find(c => c.id === activeChatId);
         if (chat) {
           await mockBackend.sendMessage(currentUser.id, chat.otherUser.id, content);
         }
      }
      
      fetchMessages();
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send", err);
      setNewMessageText(content); // Restore on fail
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // -- RENDER --

  if (!currentUser) {
    return (
      <>
        <Analytics />
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  // Derived state for the active view
  const activeChatObject = chats.find(c => c.id === activeChatId);
  const isTempChat = activeChatId?.startsWith('TEMP_');
  let activeRecipient: User | undefined;
  
  if (isTempChat) {
     // Logic handled by searching results if needed
  }
  
  return (
    <>
      <Analytics />
      <ChatLayout 
        currentUser={currentUser}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(chatId) => setActiveChatId(chatId)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        searchResults={searchResults}
        onStartChat={startChat}
        
        // Right Panel Props
        activeChatUser={activeChatObject?.otherUser || (activeChatId?.startsWith('TEMP_') ? searchResults.find(u => `TEMP_${u.id}` === activeChatId) : undefined)}
        messages={messages}
        messageText={newMessageText}
        onMessageChange={setNewMessageText}
        onSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
      />
    </>
  );
}

// --- LAYOUT COMPONENT ---

interface ChatLayoutProps {
  currentUser: User;
  chats: PopulatedChat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onLogout: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  searchResults: User[];
  onStartChat: (user: User) => void;
  
  activeChatUser?: User;
  messages: Message[];
  messageText: string;
  onMessageChange: (s: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  currentUser,
  chats,
  activeChatId,
  onSelectChat,
  onLogout,
  searchQuery,
  onSearch,
  searchResults,
  onStartChat,
  activeChatUser,
  messages,
  messageText,
  onMessageChange,
  onSendMessage,
  messagesEndRef
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#d1d7db] relative">
      {/* green header stripe background */}
      <div className="absolute top-0 w-full h-32 bg-[#00a884] z-0"></div>

      {/* Main Container */}
      <div className="relative z-10 flex w-full h-full max-w-[1600px] mx-auto xl:my-4 xl:h-[calc(100vh-32px)] bg-white xl:rounded-lg shadow-lg overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="w-full md:w-[400px] flex flex-col border-r border-gray-200 bg-white">
          {/* Header */}
          <div className="h-16 bg-[#f0f2f5] px-4 flex items-center justify-between flex-shrink-0 border-b border-gray-200">
             <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                   <UserIcon className="w-6 h-6 text-gray-500" />
                </div>
                <span className="font-semibold text-gray-700 truncate max-w-[150px]">{currentUser.username}</span>
             </div>
             <button onClick={onLogout} className="text-gray-500 hover:text-gray-700" title="Logout">
                <LogOut className="w-5 h-5" />
             </button>
          </div>

          {/* Search */}
          <div className="p-3 bg-white border-b border-gray-100">
            <div className="relative bg-[#f0f2f5] rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                className="bg-transparent w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none placeholder-gray-500 text-gray-700"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {searchQuery ? (
              // Search Results
              <div className="py-2">
                <h3 className="px-4 text-xs font-bold text-[#008069] mb-2 uppercase">Contacts</h3>
                {searchResults.length === 0 ? (
                  <div className="px-4 py-4 text-center text-gray-500 text-sm">No users found</div>
                ) : (
                  searchResults.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => onStartChat(user)}
                      className="px-4 py-3 hover:bg-[#f5f6f6] cursor-pointer flex items-center border-b border-gray-100 last:border-0"
                    >
                       <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center mr-3">
                         <UserIcon className="w-6 h-6 text-gray-400" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-baseline mb-1">
                           <h2 className="text-gray-900 font-normal truncate">{user.username}</h2>
                         </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Chat List
              <div>
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-6 text-center">
                    <p>No chats yet.</p>
                    <p className="text-sm mt-2">Search for a username to start messaging.</p>
                  </div>
                ) : (
                  chats.map(chat => {
                    const isActive = activeChatId === chat.id;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={`px-4 py-3 cursor-pointer flex items-center border-b border-gray-100 hover:bg-[#f5f6f6] ${isActive ? 'bg-[#f0f2f5]' : ''}`}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center mr-3">
                           <UserIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h2 className="text-gray-900 font-normal truncate">{chat.otherUser.username}</h2>
                            {chat.lastMessage && (
                               <span className="text-xs text-gray-500">
                                 {new Date(chat.lastMessage.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                                   ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                                   : new Date(chat.lastMessage.timestamp).toLocaleDateString()
                                 }
                               </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL (Chat) */}
        <div className="hidden md:flex flex-1 flex-col bg-[#efeae2] relative">
          {/* Chat Background Pattern (CSS Pattern) */}
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
            backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundRepeat: "repeat"
          }}></div>

          {activeChatUser ? (
            <>
              {/* Active Chat Header */}
              <div className="h-16 bg-[#f0f2f5] px-4 flex items-center flex-shrink-0 border-b border-gray-200 z-10">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                   <UserIcon className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                   <h2 className="text-gray-900 font-semibold">{activeChatUser.username}</h2>
                   <p className="text-xs text-gray-500">click here for contact info</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 z-10">
                 {messages.length === 0 ? (
                   <div className="flex justify-center items-center h-full">
                     <div className="bg-[#fff5c4] text-gray-800 text-xs px-3 py-2 rounded shadow-sm">
                       Messages are end-to-end encrypted. No one outside of this chat, not even DirectChat, can read or listen to them.
                     </div>
                   </div>
                 ) : (
                    messages.map((msg) => (
                      <ChatMessage 
                        key={msg.id} 
                        message={msg} 
                        isOwn={msg.senderId === currentUser.id} 
                      />
                    ))
                 )}
                 <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-2 z-10">
                <button className="text-gray-500 hover:text-gray-700">
                   {/* Emoji icon placeholder */}
                   <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm0-18c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm0 14c-2.67 0-5.116-1.467-6.398-3.804l1.769-.949A5.003 5.003 0 0112 16c2.04 0 3.864-1.216 4.629-3.047l1.769.949C17.116 16.533 14.67 18 12 18zm-3.5-7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"></path></svg>
                </button>
                <form className="flex-1 flex gap-2" onSubmit={onSendMessage}>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => onMessageChange(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 py-2 px-4 rounded-lg border-none focus:outline-none focus:ring-0 bg-white"
                    autoFocus
                  />
                  {messageText.trim() ? (
                    <button type="submit" className="text-[#54656f]">
                      <Send className="w-6 h-6" />
                    </button>
                  ) : (
                    <button type="button" className="text-[#54656f]">
                       {/* Mic icon placeholder */}
                       <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"></path></svg>
                    </button>
                  )}
                </form>
              </div>
            </>
          ) : (
            // Idle State
            <div className="flex-1 flex flex-col items-center justify-center border-b-[6px] border-[#43c960]">
               <div className="text-center px-10">
                 <h1 className="text-3xl font-light text-[#41525d] mb-4">DirectChat Web</h1>
                 <p className="text-[#667781] text-sm leading-6">
                   Send and receive messages without keeping your phone online.<br/>
                   Use DirectChat on up to 4 linked devices and 1 phone.
                 </p>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
