
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

// Posts API
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

  // Reshape the data to match our Post interface
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
  // Get posts from users that the current user follows
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
    .in('user_id', 
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Reshape the data
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

  // Increment the likes_count in the posts table
  await supabase
    .from('posts')
    .update({ likes_count: supabase.rpc('increment', { row_id: postId }) })
    .eq('id', postId);

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

  // Decrement the likes_count in the posts table
  await supabase
    .from('posts')
    .update({ likes_count: supabase.rpc('decrement', { row_id: postId }) })
    .eq('id', postId);

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

// User Profiles API
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  // Get follower and following counts
  const { count: followersCount } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact' })
    .eq('following_id', userId);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact' })
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

  // Get follower and following counts
  const { count: followersCount } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact' })
    .eq('following_id', data.id);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact' })
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

// Follow System API
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

// Search API
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
