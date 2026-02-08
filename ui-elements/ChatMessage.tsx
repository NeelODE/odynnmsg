import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[65%] px-3 py-2 rounded-lg shadow-sm text-sm ${
          isOwn 
            ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' 
            : 'bg-white text-gray-900 rounded-tl-none'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className={`text-[10px] mt-1 text-right ${isOwn ? 'text-gray-500' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </div>
        
        {/* Tail decoration */}
        <div className={`absolute top-0 w-2 h-3 ${
            isOwn 
              ? '-right-2 bg-[#d9fdd3]' 
              : '-left-2 bg-white'
          }`}
          style={{
             clipPath: isOwn 
               ? 'polygon(0 0, 0% 100%, 100% 0)' 
               : 'polygon(100% 0, 100% 100%, 0 0)'
          }}
        />
      </div>
    </div>
  );
};

export default ChatMessage;