import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './entities/place.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findAll() {
    return this.placeRepo.find();
  }

  findOne(id: string) {
    return this.placeRepo.findOne({ where: { id } });
  }

  create(dto: CreatePlaceDto) {
    const place = this.placeRepo.create({
      ...dto,
      date: new Date(dto.date),
      reserved: 0,
    });

    return this.placeRepo.save(place);
  }

  async update(id: string, dto: UpdatePlaceDto) {
    const place = await this.findOne(id);

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    Object.assign(place, dto);

    if (dto.date) {
      place.date = new Date(dto.date);
    }

    return this.placeRepo.save(place);
  }

  async remove(id: string) {
    const place = await this.findOne(id);

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    return this.placeRepo.remove(place);
  }

  async reserve(placeId: string, userId: string) {
    const place = await this.findOne(placeId);

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    if (place.reserved >= place.capacity) {
      throw new BadRequestException('No more places available');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingReservation = await this.reservationRepo.findOne({
      where: {
        place: { id: placeId },
        user: { id: userId },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('You already reserved this place');
    }

    const reservation = this.reservationRepo.create({
      place,
      user,
      status: 'confirmed',
    });

    place.reserved += 1;

    await this.placeRepo.save(place);
    return this.reservationRepo.save(reservation);
  }
}