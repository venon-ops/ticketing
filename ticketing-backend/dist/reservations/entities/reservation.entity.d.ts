import { Place } from '../../places/entities/place.entity';
import { User } from '../../users/entities/user.entity';
export declare class Reservation {
    id: string;
    place: Place;
    user: User;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
