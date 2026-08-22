import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Controller('events')
export class EventsController {
  private async getOwnedEvent(userId: string, eventId: string) {
    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (organizationError || !organization) {
      throw new BadRequestException(
        'Aucune organisation trouvée pour cet utilisateur',
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('organization_id', organization.id)
      .single();

    if (eventError || !event) {
      throw new BadRequestException('Événement non trouvé ou non autorisé');
    }

    return event;
  }

  @Get('public/list')
  async getPublicEvents() {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(
        'id, name, description, location_name, venue, address, date_start, date_end, image_url',
      )
      .eq('status', 'published')
      .gte('date_start', now)
      .order('date_start', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data || [];
  }

  @Get('public/:id')
  async getPublicEvent(@Param('id') id: string) {
    const now = new Date().toISOString();

    const { data: event, error } = await supabase
      .from('events')
      .select(
        'id, name, description, location_name, venue, address, date_start, date_end, image_url, organization_id',
      )
      .eq('id', id)
      .eq('status', 'published')
      .gte('date_start', now)
      .single();

    if (error || !event) {
      throw new NotFoundException('Événement non trouvé');
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name, description')
      .eq('id', event.organization_id)
      .single();

    const { data: artists, error: artistsError } = await supabase
      .from('event_artists')
      .select(
        `
          id,
          slot_start,
          slot_end,
          notes,
          artist:artist_id (
            id,
            stage_name,
            bio
          )
        `,
      )
      .eq('event_id', id)
      .order('slot_start', { ascending: true });

    if (artistsError) {
      throw new BadRequestException(artistsError.message);
    }

    return {
      ...event,
      organization: organization || null,
      artists: artists || [],
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createEvent(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;

    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (organizationError || !organization) {
      throw new BadRequestException(
        'Aucune organisation trouvée pour cet utilisateur',
      );
    }

    const {
      name,
      description,
      location_name,
      venue,
      address,
      date_start,
      date_end,
      capacity,
      image_url,
    } = body;

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        organization_id: organization.id,
        name,
        description: description || null,
        location_name: location_name || null,
        venue: venue || null,
        address: address || null,
        date_start,
        date_end: date_end || null,
        capacity: capacity || null,
        image_url: image_url || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error || !event) {
      throw new BadRequestException(
        error?.message || "Impossible de créer l'événement",
      );
    }

    return event;
  }

  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  async getMyEvents(@Req() req: any) {
    const userId = req.user.id;

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !organization) {
      return [];
    }

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organization.id)
      .order('date_start', { ascending: true });

    if (eventsError) {
      throw new BadRequestException(eventsError.message);
    }

    return events || [];
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getEvent(@Req() req: any, @Param('id') id: string) {
    return this.getOwnedEvent(req.user.id, id);
  }

  @Post(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateEvent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const event = await this.getOwnedEvent(req.user.id, id);

    const {
      name,
      description,
      location_name,
      venue,
      address,
      date_start,
      date_end,
      capacity,
      image_url,
      status,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location_name !== undefined) updateData.location_name = location_name;
    if (venue !== undefined) updateData.venue = venue;
    if (address !== undefined) updateData.address = address;
    if (date_start !== undefined) updateData.date_start = date_start;
    if (date_end !== undefined) updateData.date_end = date_end;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (image_url !== undefined) updateData.image_url = image_url;

    if (status !== undefined && status !== 'published') {
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return event;
    }

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedEvent) {
      throw new BadRequestException(
        error?.message || "Impossible de mettre à jour l'événement",
      );
    }

    return updatedEvent;
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  async publishEvent(@Req() req: any, @Param('id') id: string) {
    const event = await this.getOwnedEvent(req.user.id, id);

    if (
      !event.name ||
      !event.location_name ||
      !event.address ||
      !event.date_start ||
      !event.date_end ||
      !event.capacity
    ) {
      throw new BadRequestException(
        "Complète toutes les informations de l'événement avant publication",
      );
    }

    const eventCapacity = Number(event.capacity);

    if (!Number.isInteger(eventCapacity) || eventCapacity < 1) {
      throw new BadRequestException(
        "La capacité de l'événement doit être supérieure à zéro",
      );
    }

    const { data: phases, error: phasesError } = await supabase
      .from('ticket_phases')
      .select('id, quantity_total, is_visible')
      .eq('event_id', id);

    if (phasesError) {
      throw new BadRequestException(phasesError.message);
    }

    const visiblePhases = (phases || []).filter(
      (phase) => phase.is_visible === true,
    );

    if (visiblePhases.length === 0) {
      throw new BadRequestException(
        'Crée au moins une phase de billets visible avant publication',
      );
    }

    const totalTickets = visiblePhases.reduce(
      (total, phase) => total + Number(phase.quantity_total),
      0,
    );

    if (totalTickets > eventCapacity) {
      throw new BadRequestException(
        `Les billets configurés (${totalTickets}) dépassent la capacité de l'événement (${eventCapacity})`,
      );
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedEvent) {
      throw new BadRequestException(
        updateError?.message || "Impossible de publier l'événement",
      );
    }

    return updatedEvent;
  }
}