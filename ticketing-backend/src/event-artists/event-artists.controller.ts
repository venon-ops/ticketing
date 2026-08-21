import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Req,
  Body,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Controller('event-artists')
@UseGuards(AuthGuard('jwt'))
export class EventArtistsController {
  @Get(':eventId')
  async getEventArtists(@Param('eventId') eventId: string) {
    const { data, error } = await supabase
      .from('event_artists')
      .select(`
        *,
        artist:artist_id (
          id,
          stage_name,
          bio,
          user_id
        )
      `)
      .eq('event_id', eventId)
      .order('slot_start', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  @Post()
  async addArtistToEvent(@Req() req: any, @Body() body: any) {
    const userId = req.user.sub;

    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!organization) {
      throw new Error("Aucune organisation trouvée pour cet utilisateur");
    }

    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', body.event_id)
      .eq('organization_id', organization.id)
      .single();

    if (!event) {
      throw new Error("Événement non trouvé ou non autorisé");
    }

    const { data, error } = await supabase
      .from('event_artists')
      .insert({
        event_id: body.event_id,
        artist_id: body.artist_id,
        slot_start: body.slot_start,
        slot_end: body.slot_end,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  @Delete(':id')
  async removeArtistFromEvent(@Param('id') id: string) {
    const { error } = await supabase
      .from('event_artists')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  }
}