
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { format } from 'date-fns';
import { Message, UserProfile, sendMessage, getMessages, markMessagesAsRead } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";

interface ChatBoxProps {
  recipient: UserProfile | null;
}

const ChatBox = ({ recipient }: ChatBoxProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!user || !recipient) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const fetchedMessages = await getMessages(user.id, recipient.id);
        setMessages(fetchedMessages);
        
        // Mark messages as read
        await markMessagesAsRead(user.id, recipient.id);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id=eq.${user.id},recipient_id=eq.${recipient.id}),and(sender_id=eq.${recipient.id},recipient_id=eq.${user.id}))`
        },
        async (payload) => {
          // Fetch the new message with profile information
          const { data } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              read,
              sender_id,
              recipient_id,
              sender:sender_id (username, display_name, avatar_url),
              recipient:recipient_id (username, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (data) {
            setMessages(prev => [...prev, data as Message]);
            
            // Mark as read if current user is the recipient
            if (data.recipient_id === user.id) {
              await markMessagesAsRead(user.id, recipient.id);
            }
          }
        }
      )
      .subscribe();
      
    // Update read status for received messages
    const readChannel = supabase
      .channel('public:messages:read')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `and(sender_id=eq.${user.id},recipient_id=eq.${recipient.id})`
        },
        (payload) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, read: payload.new.read } : msg
            )
          );
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(readChannel);
    };
  }, [user, recipient]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !recipient || !newMessage.trim()) return;
    
    try {
      setSending(true);
      await sendMessage(user.id, recipient.id, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };
  
  if (!recipient) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)]">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b border-white/10">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={recipient.avatar_url || ''} />
          <AvatarFallback className="bg-bancax/20">
            {recipient.display_name?.charAt(0) || recipient.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{recipient.display_name}</p>
          <p className="text-sm text-muted-foreground">@{recipient.username}</p>
        </div>
      </div>
      
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUserSender = message.sender_id === user?.id;
              const messageDate = new Date(message.created_at);
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex max-w-[75%]">
                    {!isCurrentUserSender && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarImage src={message.sender?.avatar_url || ''} />
                        <AvatarFallback className="bg-bancax/20 text-xs">
                          {message.sender?.display_name?.charAt(0) || message.sender?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div 
                        className={`px-4 py-2 rounded-lg ${
                          isCurrentUserSender 
                            ? 'bg-bancax text-white' 
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {format(messageDate, 'h:mm a')}
                        </span>
                        {isCurrentUserSender && (
                          <span className="text-xs text-muted-foreground">
                            {message.read ? 'Read' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            className="bg-white/5"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
