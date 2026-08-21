export enum UserRole {
  USER = 'user',
  ARTIST = 'artist',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
}

export class User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;

  artist_profile?: ArtistProfile;
  organization?: Organization;
}

export class Organization {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;

  user?: User;
}

export class ArtistProfile {
  id: string;
  user_id: string;
  stage_name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  social_links?: Record<string, string>;
  created_at: string;
  updated_at: string;

  user?: User;
  posts?: Post[];
}

export class Post {
  id: string;
  artist_id: string;
  title: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'link';
  created_at: string;
  updated_at: string;

  artist?: ArtistProfile;
}

export class Follow {
  id: string;
  follower_user_id: string;
  artist_id: string;
  created_at: string;

  follower?: User;
  artist?: ArtistProfile;
}