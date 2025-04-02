
import { useState } from "react";
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

interface PostItemProps {
  post: Post;
  onPostUpdate?: (updatedPost: Post) => void;
}

const PostItem = ({ post, onPostUpdate }: PostItemProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleLikeToggle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (isLiked) {
        await unlikePost(post.id, user.id);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await likePost(post.id, user.id);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
      
      // Update the post with new like status
      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          is_liked: !isLiked,
          likes_count: isLiked ? likesCount - 1 : likesCount + 1
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to like/unlike post",
        variant: "destructive"
      });
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
