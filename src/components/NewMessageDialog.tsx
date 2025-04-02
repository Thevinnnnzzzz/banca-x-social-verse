
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { searchUsers, UserProfile } from "../services/api";
import { supabase } from "../integrations/supabase/client";

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: UserProfile) => void;
}

const NewMessageDialog = ({ open, onOpenChange, onSelectUser }: NewMessageDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Debounce the search query to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const performSearch = async () => {
      setLoading(true);
      try {
        const results = await searchUsers(debouncedSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    performSearch();
  }, [debouncedSearchQuery]);
  
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };
  
  const handleSelectUser = (user: UserProfile) => {
    onSelectUser(user);
    onOpenChange(false);
    setSearchQuery("");
    setSearchResults([]);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Search for users to start a conversation
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <Command className="rounded-lg border border-white/10 overflow-visible">
            <CommandInput 
              placeholder="Search for users..." 
              value={searchQuery}
              onValueChange={handleSearch}
              className="text-white"
            />
            <CommandList>
              {loading ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-auto">
                    {searchResults.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.username}
                        onSelect={() => handleSelectUser(user)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-bancax/20">
                              {user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;
