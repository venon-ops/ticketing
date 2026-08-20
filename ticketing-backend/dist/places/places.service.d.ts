import { Repository } from 'typeorm';
import { Place } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
export declare class PlacesService {
    private readonly placeRepo;
    constructor(placeRepo: Repository<Place>);
    findAll(): Promise<Place[]>;
    findOne(id: string): Promise<Place | null>;
    create(dto: CreatePlaceDto): Promise<Place>;
    update(id: string, dto: UpdatePlaceDto): Promise<Place>;
    remove(id: string): Promise<Place>;
    reserve(id: string): Promise<Place>;
}
