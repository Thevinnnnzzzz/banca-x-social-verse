
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Trash2,
  Loader2 
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Conversation, deleteConversation } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!user) return null;

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Get other user ID based on the conversation
      const isCurrentUserSender = conversationToDelete.sender_id === user.id;
      const otherUserId = isCurrentUserSender 
        ? conversationToDelete.recipient_id 
        : conversationToDelete.sender_id;
      
      await deleteConversation(user.id, otherUserId);
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been permanently deleted",
      });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      
      // If the deleted conversation was selected, clear the selection
      if (selectedConversationUserId === otherUserId) {
        onSelectConversation('');
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
              >
                <div 
                  className="flex flex-1 items-center"
                  onClick={() => onSelectConversation(otherUser.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-500"
                      onClick={() => {
                        setConversationToDelete(conversation);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
      
      {/* Delete Conversation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all messages in this conversation for you. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
};

export default ConversationList;
