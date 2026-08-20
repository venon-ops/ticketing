import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Place } from '../places/entities/place.entity';
import { User } from '../users/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateReservationDto) {
    const place = await this.placeRepo.findOne({ where: { id: dto.placeId } });
    if (!place) throw new NotFoundException('Place not found');

    if (place.reserved >= place.capacity) {
      throw new BadRequestException('No more places available');
    }

    const existing = await this.reservationRepo.findOne({
      where: {
        user: { id: userId },
        place: { id: dto.placeId },
        status: 'confirmed',
      },
    });
    if (existing) {
      throw new BadRequestException('You already have a reservation for this place');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const reservation = this.reservationRepo.create({
      place,
      user,
      status: 'confirmed',
    });

    place.reserved += 1;
    await this.placeRepo.save(place);

    return this.reservationRepo.save(reservation);
  }

  findAllByUser(userId: string) {
    return this.reservationRepo.find({
      where: { user: { id: userId } },
      relations: { place: true },
    });
  }

  findOne(id: string) {
    return this.reservationRepo.findOne({
      where: { id },
      relations: { place: true, user: true },
    });
  }

  async cancel(id: string) {
    const reservation = await this.findOne(id);
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Reservation already cancelled');
    }

    const place = await this.placeRepo.findOne({ where: { id: reservation.place.id } });
    if (place) {
      place.reserved = Math.max(0, place.reserved - 1);
      await this.placeRepo.save(place);
    }

    reservation.status = 'cancelled';
    return this.reservationRepo.save(reservation);
  }

  async remove(id: string) {
    const reservation = await this.findOne(id);
    if (!reservation) throw new NotFoundException('Reservation not found');
    return this.reservationRepo.remove(reservation);
  }
}