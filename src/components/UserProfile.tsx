
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserProfile,
  getPosts,
  Post,
  UserProfile as UserProfileType,
  followUser,
  unfollowUser,
  isFollowing
} from "../services/api";
import PostItem from "./PostItem";
import { toast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isUserFollowing, setIsUserFollowing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const [profileData, postsData] = await Promise.all([
          getUserProfile(userId),
          getPosts(userId)
        ]);
        
        setProfile(profileData);
        setPosts(postsData);
        
        // Check if current user is following this profile
        if (user && user.id !== userId) {
          const following = await isFollowing(user.id, userId);
          setIsUserFollowing(following);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, user]);

  const handleFollowToggle = async () => {
    if (!user || !profile) return;
    
    setFollowLoading(true);
    try {
      if (isUserFollowing) {
        await unfollowUser(user.id, profile.id);
        setIsUserFollowing(false);
        setProfile({
          ...profile,
          followers_count: profile.followers_count - 1
        });
      } else {
        await followUser(user.id, profile.id);
        setIsUserFollowing(true);
        setProfile({
          ...profile,
          followers_count: profile.followers_count + 1
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-bancax" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <p className="text-lg">User not found</p>
        <Button 
          variant="link" 
          onClick={() => navigate("/")}
          className="mt-4"
        >
          Return to home
        </Button>
      </div>
    );
  }

  const joinedDate = format(new Date(profile.created_at), "MMMM yyyy");

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur bg-background/80 p-4 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-bold text-xl">{profile.display_name || profile.username}</h1>
          <p className="text-xs text-muted-foreground">{posts.length} posts</p>
        </div>
      </div>
      
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-cyan-900 to-blue-900"></div>
      
      {/* Profile Details */}
      <div className="px-4 pb-4 relative">
        <Avatar className="h-24 w-24 absolute -top-12 border-4 border-background">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="text-2xl bg-bancax/20">
            {profile.display_name?.charAt(0) || profile.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex justify-end mt-2">
          {user && user.id !== profile.id && (
            <Button 
              variant={isUserFollowing ? "outline" : "default"}
              className={isUserFollowing ? "" : "bg-bancax hover:bg-bancax/90"}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isUserFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>
        
        <div className="mt-10">
          <h2 className="font-bold text-xl">{profile.display_name || "User"}</h2>
          <p className="text-muted-foreground">@{profile.username}</p>
          
          {profile.bio && (
            <p className="mt-3">{profile.bio}</p>
          )}
          
          <div className="flex items-center gap-2 mt-3 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Joined {joinedDate}</span>
          </div>
          
          <div className="flex gap-4 mt-3">
            <div className="text-sm">
              <span className="font-bold">{profile.following_count}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div className="text-sm">
              <span className="font-bold">{profile.followers_count}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Posts */}
      <div className="mt-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostItem 
              key={post.id} 
              post={post} 
              onPostUpdate={handlePostUpdate}
            />
          ))
        ) : (
          <div className="text-center py-10 glass-card mx-4">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
