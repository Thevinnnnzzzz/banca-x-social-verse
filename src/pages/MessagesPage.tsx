
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Widgets from "../components/Widgets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Plus } from "lucide-react";
import ConversationList from "../components/ConversationList";
import ChatBox from "../components/ChatBox";
import NewMessageDialog from "../components/NewMessageDialog";
import { Conversation, UserProfile, getConversations, getUserProfile } from "../services/api";
import { supabase } from "../integrations/supabase/client";
import { toast } from "../components/ui/use-toast";

const MessagesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const fetchedConversations = await getConversations(user.id);
        setConversations(fetchedConversations);

        // Select the first conversation if any exist
        if (fetchedConversations.length > 0) {
          const firstConv = fetchedConversations[0];
          const otherUserId = firstConv.sender_id === user.id 
            ? firstConv.recipient_id 
            : firstConv.sender_id;
          
          setSelectedConversationUserId(otherUserId);
          
          // Fetch full user profile 
          const userProfile = await getUserProfile(otherUserId);
          setSelectedUser(userProfile);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id=eq.${user.id},recipient_id=eq.${user.id})`
        },
        async () => {
          // Refresh conversations when a new message is received
          const fetchedConversations = await getConversations(user.id);
          setConversations(fetchedConversations);
        }
      )
      .subscribe();

    // Subscribe to message updates (read status)
    const updateChannel = supabase
      .channel('public:messages:updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id=eq.${user.id},recipient_id=eq.${user.id})`
        },
        async () => {
          // Refresh conversations when a message is updated
          const fetchedConversations = await getConversations(user.id);
          setConversations(fetchedConversations);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, [user]);

  const handleSelectConversation = async (userId: string) => {
    setSelectedConversationUserId(userId);
    try {
      const userProfile = await getUserProfile(userId);
      setSelectedUser(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive"
      });
    }
  };

  const handleNewMessage = (selectedUser: UserProfile) => {
    setSelectedUser(selectedUser);
    setSelectedConversationUserId(selectedUser.id);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-gradient animate-pulse">BancaX</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto grid grid-cols-12 gap-4 px-4">
      <div className="hidden md:block md:col-span-3 lg:col-span-2">
        <Sidebar />
      </div>
      <main className="col-span-12 md:col-span-9 lg:col-span-7 pt-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setNewMessageDialogOpen(true)}
            className="border-white/20 hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {!user ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">You need to sign in</h2>
              <p className="text-muted-foreground">
                Please log in to view your messages
              </p>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <h2 className="text-xl font-medium mb-2">Loading messages</h2>
              <p className="text-muted-foreground">
                Please wait while we fetch your conversations
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4">
              <Card className="glass-card h-full">
                <CardContent className="p-4">
                  <div className="font-medium mb-2">Conversations</div>
                  <ConversationList 
                    conversations={conversations} 
                    selectedConversationUserId={selectedConversationUserId}
                    onSelectConversation={handleSelectConversation}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="col-span-12 md:col-span-8">
              <Card className="glass-card h-full">
                <CardContent className="p-0">
                  <ChatBox recipient={selectedUser} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <div className="hidden lg:block lg:col-span-3 pt-4">
        <Widgets />
      </div>
      
      {/* Mobile navigation - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-white/10 z-50">
        <Sidebar />
      </div>
      
      {/* New message dialog */}
      <NewMessageDialog 
        open={newMessageDialogOpen}
        onOpenChange={setNewMessageDialogOpen}
        onSelectUser={handleNewMessage}
      />
    </div>
  );
};

export default MessagesPage;
