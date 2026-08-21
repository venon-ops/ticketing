import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  async create(dto: CreateReservationDto) {
    const { user_id, place_id, status = 'pending' } = dto;

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id,
        place_id,
        status,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as unknown as Reservation;
  }

  async findAll() {
    const { data, error } = await supabase.from('reservations').select('*');
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data as unknown as Reservation[];
  }

  async findAllByUser(userId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as unknown as Reservation[];
  }

  async findOne(id: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Reservation not found');
    }

    return data as unknown as Reservation;
  }

  async update(id: string, dto: UpdateReservationDto) {
    const updateData: Record<string, unknown> = {};

    if (dto.status) updateData.status = dto.status;
    if (dto.user_id) updateData.user_id = dto.user_id;
    if (dto.place_id) updateData.place_id = dto.place_id;

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Reservation not found');
    }

    return data as unknown as Reservation;
  }

  async cancel(id: string) {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Reservation not found');
    }

    return data as unknown as Reservation;
  }

  async remove(id: string) {
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) {
      throw new BadRequestException(error.message);
    }
    return { id };
  }
}