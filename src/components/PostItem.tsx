
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { likePost, unlikePost, Post } from "../services/api";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "../integrations/supabase/client";

interface PostItemProps {
  post: Post;
  onPostUpdate?: (updatedPost: Post) => void;
}

const PostItem = ({ post, onPostUpdate }: PostItemProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Update local state when post prop changes (e.g., from realtime updates)
    setIsLiked(post.is_liked || false);
    setLikesCount(post.likes_count || 0);
  }, [post.is_liked, post.likes_count]);

  useEffect(() => {
    // Subscribe to realtime likes updates
    if (!post.id) return;

    const channel = supabase
      .channel('public:likes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `post_id=eq.${post.id}`,
      }, (payload) => {
        // Update likes count based on the event type
        if (payload.eventType === 'INSERT') {
          setLikesCount(prev => prev + 1);
          // If the current user is the one who liked the post, update UI
          if (user && payload.new.user_id === user.id) {
            setIsLiked(true);
          }
        } else if (payload.eventType === 'DELETE') {
          setLikesCount(prev => Math.max(0, prev - 1));
          // If the current user is the one who unliked the post, update UI
          if (user && payload.old.user_id === user.id) {
            setIsLiked(false);
          }
        }
      })
      .subscribe();

    // Also subscribe to direct post updates
    const postChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'posts',
        filter: `id=eq.${post.id}`,
      }, (payload) => {
        if (payload.new && onPostUpdate) {
          // We need to preserve our post data structure
          const updatedPost = {
            ...post,
            ...payload.new,
          };
          onPostUpdate(updatedPost);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(postChannel);
    };
  }, [post.id, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isLiked) {
        await unlikePost(post.id, user.id);
        // UI will update via the realtime subscription
      } else {
        await likePost(post.id, user.id);
        // UI will update via the realtime subscription
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to like/unlike post",
        variant: "destructive"
      });
      // Revert the local state in case of error
      setIsLiked(prevIsLiked => !prevIsLiked);
      setLikesCount(prevCount => isLiked ? prevCount + 1 : prevCount - 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4 glass-card border-white/5 overflow-hidden hover:bg-white/5 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link to={`/profile/${post.user_id}`}>
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage src={post.author?.avatar_url} />
              <AvatarFallback className="bg-bancax/20">
                {post.author?.display_name?.charAt(0) || post.author?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.user_id}`} className="font-semibold hover:underline truncate">
                {post.author?.display_name || "User"}
              </Link>
              <span className="text-muted-foreground text-xs">
                @{post.author?.username || "username"}
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between px-4 py-2 border-t border-white/5">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white hover:bg-white/5">
          <MessageCircle className="h-4 w-4 mr-1" />
          <span className="text-xs">0</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10">
          <Repeat2 className="h-4 w-4 mr-1" />
          <span className="text-xs">0</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "hover:bg-red-500/10",
            isLiked 
              ? "text-red-500" 
              : "text-muted-foreground hover:text-red-500"
          )}
          onClick={handleLikeToggle}
          disabled={isLoading}
        >
          <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
          <span className="text-xs">{likesCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-bancax hover:bg-bancax/10">
          <Share className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PostItem;
