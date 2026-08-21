import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateArtistProfileDto } from './dto/update-artist-profile.dto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Injectable()
export class ArtistsService {
  async getAllArtists() {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('id, user_id, stage_name, bio, avatar_url, banner_url')
      .order('stage_name', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data ?? [];
  }

  async getArtistById(artistId: string) {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('id, user_id, stage_name, bio, avatar_url, banner_url')
      .eq('id', artistId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Artiste introuvable');
    }

    return data;
  }

  async getMyProfile(userId: string) {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Profil artiste introuvable');
    }

    return data;
  }

  async updateMyProfile(userId: string, dto: UpdateArtistProfileDto) {
    const { data: profile, error: findError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (findError || !profile) {
      throw new NotFoundException('Profil artiste introuvable');
    }

    const { data, error } = await supabase
      .from('artist_profiles')
      .update(dto)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async getPosts(artistId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data ?? [];
  }

  async createPost(userId: string, artistId: string, dto: CreatePostDto) {
    const { data: profile, error: profileError } = await supabase
      .from('artist_profiles')
      .select('id, user_id')
      .eq('id', artistId)
      .single();

    if (profileError || !profile) {
      throw new NotFoundException('Profil artiste introuvable');
    }

    if (profile.user_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez publier que sur votre profil');
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        artist_id: artistId,
        title: dto.title,
        content: dto.content,
        media_url: dto.media_url ?? null,
        media_type: dto.media_type ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
