import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  @Get('mine')
  async findMyTickets(@Req() request: any) {
    const userId = request.user.id;

    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
          id,
          event_id,
          status,
          created_at,
          events (
            id,
            name,
            date_start,
            location_name,
            venue,
            image_url
          )
        `,
      )
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data || [];
  }

  @Get('event/:eventId/mine')
  async findMyTicketsForEvent(
    @Req() request: any,
    @Param('eventId') eventId: string,
  ) {
    const userId = request.user.id;

    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
          id,
          event_id,
          ticket_phase_id,
          status,
          qr_token,
          created_at,
          ticket_phases (
            id,
            name,
            price_cents
          ),
          events (
            id,
            name,
            date_start,
            location_name,
            venue,
            address,
            image_url
          )
        `,
      )
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Aucun billet trouvé pour cet événement');
    }

    return data;
  }
}
