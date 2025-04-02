
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import PostItem from "../components/PostItem";
import Widgets from "../components/Widgets";
import { Input } from "@/components/ui/input";
import { getPosts, Post, enableRealtimeForPosts } from "../services/api";
import { Search, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "../integrations/supabase/client";

const ExplorePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
      
      // Enable realtime for posts after fetching
      await enableRealtimeForPosts();
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    // Subscribe to new posts
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, async () => {
        // Fetch all posts again to ensure we have author details
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
        toast({
          title: "New content",
          description: "New posts are available"
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const filteredPosts = searchQuery
    ? posts.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="min-h-screen max-w-7xl mx-auto grid grid-cols-12 gap-4 px-4">
      <div className="hidden md:block md:col-span-3 lg:col-span-2">
        <Sidebar />
      </div>
      <main className="col-span-12 md:col-span-9 lg:col-span-7 pt-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-4">Explore</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-bancax" />
          </div>
        ) : filteredPosts.length > 0 ? (
          <div>
            {filteredPosts.map((post) => (
              <PostItem key={post.id} post={post} onPostUpdate={handlePostUpdate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 glass-card">
            <p className="text-muted-foreground">
              {searchQuery ? "No posts match your search" : "No posts available"}
            </p>
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
    </div>
  );
};

export default ExplorePage;
