import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Place } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { ShareEventDto } from './dto/share-event.dto';
import { Reservation } from '../reservations/entities/reservation.entity';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Injectable()
export class PlacesService {
  async create(dto: CreatePlaceDto) {
    const { artist_ids, ...placeData } = dto;

    const { data: place, error: placeError } = await supabase
      .from('places')
      .insert(placeData)
      .select()
      .single();

    if (placeError || !place) {
      throw new BadRequestException(
        placeError?.message || 'Impossible de créer la soirée',
      );
    }

    await this.replaceEventArtists(place.id, artist_ids ?? []);

    return this.findOne(place.id);
  }

  async findAll() {
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        event_artists (
          artist:artist_profiles (
            id,
            stage_name,
            avatar_url
          )
        )
      `)
      .order('date', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data ?? [];
  }

  async findOne(id: string) {
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        event_artists (
          artist:artist_profiles (
            id,
            stage_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Place not found');
    }

    return data as unknown as Place;
  }

  async update(id: string, dto: UpdatePlaceDto) {
    const { artist_ids, ...placeData } = dto;

    const { data: place, error } = await supabase
      .from('places')
      .update(placeData)
      .eq('id', id)
      .select()
      .single();

    if (error || !place) {
      throw new NotFoundException('Place not found');
    }

    if (artist_ids !== undefined) {
      await this.replaceEventArtists(id, artist_ids);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const { error } = await supabase.from('places').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { id };
  }

  async reserve(placeId: string, userId: string) {
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      throw new NotFoundException('Place not found');
    }

    const capacity = Number((place as any).capacity);
    const reserved = Number((place as any).reserved ?? 0);

    if (reserved >= capacity) {
      throw new BadRequestException('No available seats');
    }

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        user_id: userId,
        place_id: placeId,
        status: 'pending',
      })
      .select()
      .single();

    if (reservationError) {
      throw new BadRequestException(reservationError.message);
    }

    const { error: updateError } = await supabase
      .from('places')
      .update({
        reserved: reserved + 1,
      })
      .eq('id', placeId);

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    return reservation as unknown as Reservation;
  }

  async getAnnouncement(placeId: string) {
    await this.findOne(placeId);

    const { data, error } = await supabase
      .from('event_announcements')
      .select('*')
      .eq('place_id', placeId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async createOrUpdateAnnouncement(
    placeId: string,
    dto: CreateEventAnnouncementDto,
  ) {
    await this.findOne(placeId);

    const { data, error } = await supabase
      .from('event_announcements')
      .upsert(
        {
          place_id: placeId,
          title: dto.title,
          content: dto.content,
          image_url: dto.image_url ?? null,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'place_id' },
      )
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async shareAnnouncement(
    placeId: string,
    userId: string,
    dto: ShareEventDto,
  ) {
    const { data: artist, error: artistError } = await supabase
      .from('artist_profiles')
      .select('id, stage_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (artistError) {
      throw new BadRequestException(artistError.message);
    }

    if (!artist) {
      throw new ForbiddenException(
        'Seul un artiste peut repartager cette annonce',
      );
    }

    const { data: scheduledArtist, error: scheduledError } = await supabase
      .from('event_artists')
      .select('id')
      .eq('place_id', placeId)
      .eq('artist_id', artist.id)
      .maybeSingle();

    if (scheduledError) {
      throw new BadRequestException(scheduledError.message);
    }

    if (!scheduledArtist) {
      throw new ForbiddenException(
        'Vous n’êtes pas programmé pour cette soirée',
      );
    }

    const announcement = await this.getAnnouncement(placeId);

    if (!announcement) {
      throw new NotFoundException(
        'Aucune annonce officielle n’a encore été publiée',
      );
    }

    const { data, error } = await supabase
      .from('event_shares')
      .upsert(
        {
          place_id: placeId,
          artist_id: artist.id,
          message: dto.message ?? null,
          shared_at: new Date().toISOString(),
        },
        { onConflict: 'place_id,artist_id' },
      )
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async getArtistEventShares(artistId: string) {
    const { data, error } = await supabase
      .from('event_shares')
      .select(`
        id,
        message,
        shared_at,
        place:places (
          id,
          name,
          date,
          price,
          capacity,
          reserved
        ),
        announcement:event_announcements (
          id,
          title,
          content,
          image_url,
          published_at
        )
      `)
      .eq('artist_id', artistId)
      .order('shared_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data ?? [];
  }

  private async replaceEventArtists(placeId: string, artistIds: string[]) {
    const uniqueArtistIds = [...new Set(artistIds)];

    const { error: deleteError } = await supabase
      .from('event_artists')
      .delete()
      .eq('place_id', placeId);

    if (deleteError) {
      throw new BadRequestException(deleteError.message);
    }

    if (uniqueArtistIds.length === 0) {
      return;
    }

    const { data: artists, error: artistsError } = await supabase
      .from('artist_profiles')
      .select('id')
      .in('id', uniqueArtistIds);

    if (artistsError) {
      throw new BadRequestException(artistsError.message);
    }

    if ((artists ?? []).length !== uniqueArtistIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs artistes sont introuvables',
      );
    }

    const { error: insertError } = await supabase
      .from('event_artists')
      .insert(
        uniqueArtistIds.map((artistId) => ({
          place_id: placeId,
          artist_id: artistId,
        })),
      );

    if (insertError) {
      throw new BadRequestException(insertError.message);
    }
  }
}