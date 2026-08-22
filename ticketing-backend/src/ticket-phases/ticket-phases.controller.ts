import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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

@Controller('ticket-phases')
export class TicketPhasesController {
  private async getOwnedEventId(userId: string, eventId: string) {
    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (organizationError || !organization) {
      throw new NotFoundException(
        'Aucune organisation trouvée pour cet utilisateur',
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', organization.id)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Événement non trouvé ou non autorisé');
    }

    return event.id;
  }

  @Get('public/:eventId')
  async getPublicTicketPhases(@Param('eventId') eventId: string) {
    const { data, error } = await supabase
      .from('ticket_phases')
      .select(
        'id, event_id, name, price_cents, sale_start_at, sale_end_at, is_visible',
      )
      .eq('event_id', eventId)
      .eq('is_visible', true)
      .order('price_cents', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data || [];
  }

  @Get('event/:eventId')
  @UseGuards(AuthGuard('jwt'))
  async getOrganizationTicketPhases(
    @Req() req: any,
    @Param('eventId') eventId: string,
  ) {
    await this.getOwnedEventId(req.user.id, eventId);

    const { data, error } = await supabase
      .from('ticket_phases')
      .select('*')
      .eq('event_id', eventId)
      .order('price_cents', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data || [];
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createTicketPhase(@Req() req: any, @Body() body: any) {
    const eventId = body.event_id;

    if (!eventId) {
      throw new BadRequestException('event_id est obligatoire');
    }

    await this.getOwnedEventId(req.user.id, eventId);

    const name = String(body.name || '').trim();
    const priceCents = Number(body.price_cents);
    const quantityTotal = Number(body.quantity_total);

    if (!name) {
      throw new BadRequestException('Le nom de la phase est obligatoire');
    }

    if (!Number.isInteger(priceCents) || priceCents < 0) {
      throw new BadRequestException(
        'Le prix doit être un nombre entier positif',
      );
    }

    if (!Number.isInteger(quantityTotal) || quantityTotal <= 0) {
      throw new BadRequestException(
        'Le nombre de places doit être un entier supérieur à zéro',
      );
    }

    const { data, error } = await supabase
      .from('ticket_phases')
      .insert({
        event_id: eventId,
        name,
        price_cents: priceCents,
        quantity_total: quantityTotal,
        sale_start_at: body.sale_start_at || null,
        sale_end_at: body.sale_end_at || null,
        is_visible: body.is_visible !== false,
      })
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(
        error?.message || 'Impossible de créer la phase de billets',
      );
    }

    return data;
  }

  @Post(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateTicketPhase(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { data: ticketPhase, error: ticketPhaseError } = await supabase
      .from('ticket_phases')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketPhaseError || !ticketPhase) {
      throw new NotFoundException('Phase de billets non trouvée');
    }

    await this.getOwnedEventId(req.user.id, ticketPhase.event_id);

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (!name) {
        throw new BadRequestException('Le nom de la phase est obligatoire');
      }

      updateData.name = name;
    }

    if (body.price_cents !== undefined) {
      const priceCents = Number(body.price_cents);

      if (!Number.isInteger(priceCents) || priceCents < 0) {
        throw new BadRequestException(
          'Le prix doit être un nombre entier positif',
        );
      }

      updateData.price_cents = priceCents;
    }

    if (body.quantity_total !== undefined) {
      const quantityTotal = Number(body.quantity_total);

      if (
        !Number.isInteger(quantityTotal) ||
        quantityTotal <= 0 ||
        quantityTotal < ticketPhase.quantity_sold
      ) {
        throw new BadRequestException(
          'Le nombre de places doit être supérieur ou égal au nombre déjà vendu',
        );
      }

      updateData.quantity_total = quantityTotal;
    }

    if (body.sale_start_at !== undefined) {
      updateData.sale_start_at = body.sale_start_at || null;
    }

    if (body.sale_end_at !== undefined) {
      updateData.sale_end_at = body.sale_end_at || null;
    }

    if (body.is_visible !== undefined) {
      updateData.is_visible = body.is_visible === true;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ticket_phases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(
        error?.message || 'Impossible de modifier la phase de billets',
      );
    }

    return data;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteTicketPhase(@Req() req: any, @Param('id') id: string) {
    const { data: ticketPhase, error: ticketPhaseError } = await supabase
      .from('ticket_phases')
      .select('id, event_id, quantity_sold')
      .eq('id', id)
      .single();

    if (ticketPhaseError || !ticketPhase) {
      throw new NotFoundException('Phase de billets non trouvée');
    }

    await this.getOwnedEventId(req.user.id, ticketPhase.event_id);

    if (ticketPhase.quantity_sold > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une phase qui possède déjà des ventes',
      );
    }

    const { error } = await supabase
      .from('ticket_phases')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { ok: true };
  }
}