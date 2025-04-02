
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { searchUsers, UserProfile } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Widgets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search as user types
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5"
            />
          </div>
        </CardHeader>
        
        {loading ? (
          <CardContent className="py-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-bancax" />
          </CardContent>
        ) : searchResults.length > 0 ? (
          <CardContent className="py-2">
            {searchResults.map((profile) => (
              <Link 
                key={profile.id} 
                to={`/profile/${profile.id}`}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-md transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-bancax/20">
                    {profile.display_name?.charAt(0) || profile.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{profile.display_name || "User"}</p>
                  <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        ) : searchQuery.trim() ? (
          <CardContent className="py-4 text-center text-muted-foreground">
            No users found
          </CardContent>
        ) : null}
      </Card>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Who to follow</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-4">
          <p>Suggested users will appear here</p>
          <p className="text-sm mt-1">Start exploring to find new users</p>
        </CardContent>
      </Card>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Trending Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="hover:bg-white/5 p-2 rounded-md cursor-pointer">
            <p className="text-xs text-muted-foreground">Finance</p>
            <p className="font-medium">#CryptoMarket</p>
            <p className="text-xs text-muted-foreground">1,234 posts</p>
          </div>
          <div className="hover:bg-white/5 p-2 rounded-md cursor-pointer">
            <p className="text-xs text-muted-foreground">Business</p>
            <p className="font-medium">#Startups</p>
            <p className="text-xs text-muted-foreground">892 posts</p>
          </div>
          <div className="hover:bg-white/5 p-2 rounded-md cursor-pointer">
            <p className="text-xs text-muted-foreground">Technology</p>
            <p className="font-medium">#AI</p>
            <p className="text-xs text-muted-foreground">568 posts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Widgets;
