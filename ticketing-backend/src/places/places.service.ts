import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,
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
    if (!place) throw new NotFoundException('Place not found');
    Object.assign(place, dto);
    if (dto.date) place.date = new Date(dto.date);
    return this.placeRepo.save(place);
  }

  async remove(id: string) {
    const place = await this.findOne(id);
    if (!place) throw new NotFoundException('Place not found');
    return this.placeRepo.remove(place);
  }

  async reserve(id: string) {
    const place = await this.findOne(id);
    if (!place) throw new NotFoundException('Place not found');
    if (place.reserved >= place.capacity) {
      throw new Error('No more places available');
    }
    place.reserved += 1;
    return this.placeRepo.save(place);
  }
}