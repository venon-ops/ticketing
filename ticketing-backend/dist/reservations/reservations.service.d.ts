import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Place } from '../places/entities/place.entity';
import { User } from '../users/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
export declare class ReservationsService {
    private readonly reservationRepo;
    private readonly placeRepo;
    private readonly userRepo;
    constructor(reservationRepo: Repository<Reservation>, placeRepo: Repository<Place>, userRepo: Repository<User>);
    create(userId: string, dto: CreateReservationDto): Promise<Reservation>;
    findAllByUser(userId: string): Promise<Reservation[]>;
    findOne(id: string): Promise<Reservation | null>;
    cancel(id: string): Promise<Reservation>;
    remove(id: string): Promise<Reservation>;
}
