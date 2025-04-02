
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPost } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const MAX_CHARS = 280;

const ComposePost = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const charCount = content.length;
  const charactersLeft = MAX_CHARS - charCount;
  const isOverLimit = charactersLeft < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isOverLimit || !content.trim() || !user) return;
    
    setIsLoading(true);
    try {
      await createPost(content, user.id);
      setContent("");
      toast({
        title: "Success",
        description: "Your post has been published!",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-4 mb-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={""} />
          <AvatarFallback className="bg-bancax/20">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="What's happening in your financial world?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
          <div className="flex items-center justify-between mt-2">
            <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
              {charactersLeft} characters left
            </div>
            <Button 
              type="submit" 
              className="bg-bancax hover:bg-bancax/90"
              disabled={isLoading || isOverLimit || !content.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ComposePost;
