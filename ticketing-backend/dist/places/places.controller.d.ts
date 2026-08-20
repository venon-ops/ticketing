import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
export declare class PlacesController {
    private readonly placesService;
    constructor(placesService: PlacesService);
    findAll(): Promise<import("./entities/place.entity").Place[]>;
    findOne(id: string): Promise<import("./entities/place.entity").Place | null>;
    create(dto: CreatePlaceDto): Promise<import("./entities/place.entity").Place>;
    update(id: string, dto: UpdatePlaceDto): Promise<import("./entities/place.entity").Place>;
    remove(id: string): Promise<import("./entities/place.entity").Place>;
    reserve(id: string): Promise<import("./entities/place.entity").Place>;
}
