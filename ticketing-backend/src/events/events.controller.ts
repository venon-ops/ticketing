import {
  Controller,
  Post,
  Get,
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

@Controller('events')
@UseGuards(AuthGuard('jwt'))
export class EventsController {
  @Post()
  async createEvent(@Req() req: any, @Body() body: any) {
    const userId = req.user.sub;

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !organization) {
      throw new Error("Aucune organisation trouvée pour cet utilisateur");
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
      status,
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
        status: status || 'draft',
      })
      .select()
      .single();

    if (error || !event) {
      throw new Error(error?.message || "Impossible de créer l'événement");
    }

    return event;
  }

  @Get('mine')
  async getMyEvents(@Req() req: any) {
    const userId = req.user.sub;

    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!organization) {
      return [];
    }

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organization.id)
      .order('date_start', { ascending: true });

    return events || [];
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      throw new Error("Événement non trouvé");
    }

    return event;
  }

  @Post(':id')
  async updateEvent(@Req() req: any, @Param('id') id: string, @Body() body: any) {
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
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single();

    if (!event) {
      throw new Error("Événement non trouvé ou non autorisé");
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
      status,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location_name !== undefined) updateData.location_name = location_name;
    if (venue !== undefined) updateData.venue = venue;
    if (address !== undefined) updateData.address = address;
    if (date_start !== undefined) updateData.date_start = date_start;
    if (date_end !== undefined) updateData.date_end = date_end;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (status !== undefined) updateData.status = status;

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedEvent) {
      throw new Error(error?.message || "Impossible de mettre à jour l'événement");
    }

    return updatedEvent;
  }
}