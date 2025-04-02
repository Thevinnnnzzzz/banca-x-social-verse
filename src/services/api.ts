
import { supabase } from '../integrations/supabase/client';

export interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  is_liked?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  created_at: string;
  is_following?: boolean;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  image_url?: string;
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  recipient?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface Conversation {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_id: string;
  sender_username: string;
  sender_display_name: string;
  sender_avatar_url: string;
  recipient_id: string;
  recipient_username: string;
  recipient_display_name: string;
  recipient_avatar_url: string;
}

// Enable realtime for posts and likes tables
export const enableRealtimeForPosts = async () => {
  await supabase.rpc('enable_realtime', { table_name: 'posts' });
  await supabase.rpc('enable_realtime', { table_name: 'likes' });
};

export const getPosts = async (userId?: string) => {
  let query = supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      likes_count,
      profiles:user_id (username, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map((post: any): Post => ({
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    user_id: post.user_id,
    likes_count: post.likes_count,
    author: post.profiles ? {
      username: post.profiles.username,
      display_name: post.profiles.display_name,
      avatar_url: post.profiles.avatar_url
    } : undefined
  }));
};

export const getFeedPosts = async (userId: string) => {
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  
  const followingIds = followingData ? followingData.map(follow => follow.following_id) : [];

  if (followingIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      likes_count,
      profiles:user_id (username, display_name, avatar_url)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map((post: any): Post => ({
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    user_id: post.user_id,
    likes_count: post.likes_count,
    author: post.profiles ? {
      username: post.profiles.username,
      display_name: post.profiles.display_name,
      avatar_url: post.profiles.avatar_url
    } : undefined
  }));
};

export const createPost = async (content: string, userId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ content, user_id: userId }])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
};

export const likePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from('likes')
    .insert([{ post_id: postId, user_id: userId }]);

  if (error) {
    throw error;
  }

  // Using the rpc function for incrementing likes count
  await supabase.rpc('increment', { row_id: postId });

  return true;
};

export const unlikePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  // Using the rpc function for decrementing likes count
  await supabase.rpc('decrement', { row_id: postId });

  return true;
};

export const isPostLiked = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .select()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data.length > 0;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  // Fixed this to properly get count as number
  const { count: followersCount } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', userId);

  // Fixed this to properly get count as number
  const { count: followingCount } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return {
    ...data,
    followers_count: followersCount || 0,
    following_count: followingCount || 0
  } as UserProfile;
};

export const getUserProfileByUsername = async (username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('username', username)
    .single();

  if (error) {
    throw error;
  }

  const { count: followersCount } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', data.id);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('follower_id', data.id);

  return {
    ...data,
    followers_count: followersCount || 0,
    following_count: followingCount || 0
  } as UserProfile;
};

export const updateUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
};

export const followUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('follows')
    .insert([{ follower_id: followerId, following_id: followingId }]);

  if (error) {
    throw error;
  }

  return true;
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    throw error;
  }

  return true;
};

export const isFollowing = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    throw error;
  }

  return data.length > 0;
};

export const searchUsers = async (query: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw error;
  }

  return data as UserProfile[];
};

export const getConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as Conversation[];
};

export const getMessages = async (userId: string, otherUserId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      read,
      sender_id,
      recipient_id,
      image_url,
      sender:sender_id (username, display_name, avatar_url),
      recipient:recipient_id (username, display_name, avatar_url)
    `)
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data as unknown as Message[];
};

export const sendMessage = async (senderId: string, recipientId: string, content: string, imageFile?: File) => {
  let imageUrl = null;
  
  if (imageFile) {
    const filePath = `${senderId}/${Date.now()}_${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message_images')
      .upload(filePath, imageFile);
      
    if (uploadError) {
      throw uploadError;
    }
    
    const { data: urlData } = await supabase.storage
      .from('message_images')
      .getPublicUrl(filePath);
      
    imageUrl = urlData.publicUrl;
  }
  
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      sender_id: senderId,
      recipient_id: recipientId,
      content,
      image_url: imageUrl
    }])
    .select();

  if (error) {
    throw error;
  }

  return data[0] as unknown as Message;
};

export const markMessagesAsRead = async (userId: string, otherUserId: string) => {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', otherUserId)
    .eq('recipient_id', userId)
    .eq('read', false);

  if (error) {
    throw error;
  }

  return true;
};

export const deleteConversation = async (userId: string, otherUserId: string) => {
  // Fixed this to use proper RPC call syntax
  const { error } = await supabase
    .rpc('delete_conversation', {
      user_id: userId,
      other_user_id: otherUserId
    });
    
  if (error) {
    throw error;
  }
  
  return true;
};
