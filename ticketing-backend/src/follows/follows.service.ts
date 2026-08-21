import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Injectable()
export class FollowsService {
  async followArtist(followerUserId: string, artistId: string) {
    const { data: artist, error: artistError } = await supabase
      .from('artist_profiles')
      .select('id, user_id, stage_name')
      .eq('id', artistId)
      .single();

    if (artistError || !artist) {
      throw new NotFoundException('Artiste introuvable');
    }

    if (artist.user_id === followerUserId) {
      throw new BadRequestException('Vous ne pouvez pas vous suivre vous-même');
    }

    const { data: existing, error: existingError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_user_id', followerUserId)
      .eq('artist_id', artistId)
      .maybeSingle();

    if (existingError) {
      throw new BadRequestException(existingError.message);
    }

    if (existing) {
      return {
        message: 'Vous suivez déjà cet artiste',
        following: true,
      };
    }

    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_user_id: followerUserId,
        artist_id: artistId,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Artiste suivi',
      following: true,
      follow: data,
    };
  }

  async unfollowArtist(followerUserId: string, artistId: string) {
    const { data, error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_user_id', followerUserId)
      .eq('artist_id', artistId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Vous ne suivez pas cet artiste');
    }

    return {
      message: 'Abonnement supprimé',
      following: false,
    };
  }

  async getFollowedArtists(followerUserId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        artist:artist_profiles (
          id,
          user_id,
          stage_name,
          bio,
          avatar_url,
          banner_url
        )
      `)
      .eq('follower_user_id', followerUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data ?? [];
  }

  async getFeed(followerUserId: string) {
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('artist_id')
      .eq('follower_user_id', followerUserId);

    if (followsError) {
      throw new BadRequestException(followsError.message);
    }

    const artistIds = (follows ?? []).map((follow) => follow.artist_id);

    if (artistIds.length === 0) {
      return [];
    }

    const feedStartDate = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        artist_id,
        title,
        content,
        media_url,
        media_type,
        created_at,
        updated_at,
        artist:artist_profiles (
          id,
          stage_name,
          avatar_url
        )
      `)
      .in('artist_id', artistIds)
      .gte('created_at', feedStartDate)
      .order('created_at', { ascending: false });

    if (postsError) {
      throw new BadRequestException(postsError.message);
    }

    return posts ?? [];
  }
}
