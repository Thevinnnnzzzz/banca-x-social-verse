
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationUserId: string | null;
  onSelectConversation: (userId: string) => void;
}

const ConversationList = ({ 
  conversations, 
  selectedConversationUserId, 
  onSelectConversation 
}: ConversationListProps) => {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="space-y-1 pr-2">
        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation) => {
            // Determine if the current user is the sender or recipient
            const isCurrentUserSender = conversation.sender_id === user.id;
            
            // Get the other user's details
            const otherUser = isCurrentUserSender ? {
              id: conversation.recipient_id,
              username: conversation.recipient_username,
              display_name: conversation.recipient_display_name,
              avatar_url: conversation.recipient_avatar_url
            } : {
              id: conversation.sender_id,
              username: conversation.sender_username,
              display_name: conversation.sender_display_name,
              avatar_url: conversation.sender_avatar_url
            };
            
            // Check if message is unread
            const isUnread = !conversation.read && conversation.recipient_id === user.id;
            
            // Format the date
            const messageDate = new Date(conversation.created_at);
            const today = new Date();
            const isToday = messageDate.getDate() === today.getDate() &&
                           messageDate.getMonth() === today.getMonth() &&
                           messageDate.getFullYear() === today.getFullYear();
            
            const displayDate = isToday ? 
              format(messageDate, 'h:mm a') : 
              format(messageDate, 'MMM d');
            
            return (
              <div
                key={conversation.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedConversationUserId === otherUser.id
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                }`}
                onClick={() => onSelectConversation(otherUser.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.avatar_url || ''} />
                  <AvatarFallback className="bg-bancax/20">
                    {otherUser.display_name?.charAt(0) || otherUser.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">
                      {otherUser.display_name || otherUser.username}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {displayDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${isUnread ? 'font-medium text-white' : 'text-muted-foreground'}`}>
                      {isCurrentUserSender ? `You: ${conversation.content}` : conversation.content}
                    </p>
                    {isUnread && (
                      <Badge variant="default" className="bg-bancax h-2 w-2 rounded-full ml-1" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;
