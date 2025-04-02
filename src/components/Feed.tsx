
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getFeedPosts, Post } from "../services/api";
import PostItem from "./PostItem";
import ComposePost from "./ComposePost";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fetchedPosts = await getFeedPosts(user.id);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast({
        title: "Error",
        description: "Failed to load your feed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  return (
    <div className="space-y-4">
      <ComposePost onSuccess={fetchPosts} />
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-bancax" />
        </div>
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostItem key={post.id} post={post} onPostUpdate={handlePostUpdate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 glass-card">
          <p className="text-muted-foreground">No posts in your feed yet.</p>
          <p className="mt-2 text-sm">Follow users to see their posts here, or explore to find content.</p>
        </div>
      )}
    </div>
  );
};

export default Feed;
