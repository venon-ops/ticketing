import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
export declare class ReservationsController {
    private readonly reservationsService;
    constructor(reservationsService: ReservationsService);
    create(req: any, dto: CreateReservationDto): Promise<import("./entities/reservation.entity").Reservation>;
    getMine(req: any): Promise<import("./entities/reservation.entity").Reservation[]>;
    findOne(id: string): Promise<import("./entities/reservation.entity").Reservation | null>;
    cancel(id: string): Promise<import("./entities/reservation.entity").Reservation>;
    remove(id: string): Promise<import("./entities/reservation.entity").Reservation>;
}
