import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Reservation } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Injectable()
export class ReservationsService {
  async create(userId: string, dto: CreateReservationDto) {
    const { data, error } = await supabase.rpc('create_ticket_reservation', {
      p_user_id: userId,
      p_event_id: dto.event_id,
      p_ticket_phase_id: dto.ticket_phase_id,
      p_quantity: dto.quantity,
    });

    if (error || !data) {
      throw new BadRequestException(
        error?.message || 'Impossible de créer la réservation',
      );
    }

    return data as unknown as Reservation;
  }

  async findAll() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as unknown as Reservation[];
  }

  async findAllByUser(userId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        events (
          id,
          name,
          date_start,
          location_name,
          venue
        ),
        ticket_phases (
          id,
          name,
          price_cents
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        events (
          id,
          name,
          date_start,
          location_name,
          venue
        ),
        ticket_phases (
          id,
          name,
          price_cents
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Réservation introuvable');
    }

    return data;
  }

  async cancel(id: string, userId: string) {
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (reservationError || !reservation) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }

    const { error: ticketPhaseError } = await supabase
      .from('ticket_phases')
      .update({
        quantity_sold: Math.max(
          0,
          Number(reservation.quantity_sold || 0) - Number(reservation.quantity),
        ),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.ticket_phase_id);

    if (ticketPhaseError) {
      throw new BadRequestException(ticketPhaseError.message);
    }

    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(
        error?.message || 'Impossible d’annuler la réservation',
      );
    }

    return data as unknown as Reservation;
  }

  async update(id: string, dto: UpdateReservationDto) {
    const updateData: Record<string, unknown> = {};

    if (dto.status) {
      updateData.status = dto.status;
    }

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Réservation introuvable');
    }

    return data as unknown as Reservation;
  }

  async remove(id: string) {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { id };
  }
}