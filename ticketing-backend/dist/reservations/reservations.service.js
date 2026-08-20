"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("./entities/reservation.entity");
const place_entity_1 = require("../places/entities/place.entity");
const user_entity_1 = require("../users/entities/user.entity");
let ReservationsService = class ReservationsService {
    reservationRepo;
    placeRepo;
    userRepo;
    constructor(reservationRepo, placeRepo, userRepo) {
        this.reservationRepo = reservationRepo;
        this.placeRepo = placeRepo;
        this.userRepo = userRepo;
    }
    async create(userId, dto) {
        const place = await this.placeRepo.findOne({ where: { id: dto.placeId } });
        if (!place)
            throw new common_1.NotFoundException('Place not found');
        if (place.reserved >= place.capacity) {
            throw new common_1.BadRequestException('No more places available');
        }
        const existing = await this.reservationRepo.findOne({
            where: {
                user: { id: userId },
                place: { id: dto.placeId },
                status: 'confirmed',
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('You already have a reservation for this place');
        }
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const reservation = this.reservationRepo.create({
            place,
            user,
            status: 'confirmed',
        });
        place.reserved += 1;
        await this.placeRepo.save(place);
        return this.reservationRepo.save(reservation);
    }
    findAllByUser(userId) {
        return this.reservationRepo.find({
            where: { user: { id: userId } },
            relations: { place: true },
        });
    }
    findOne(id) {
        return this.reservationRepo.findOne({
            where: { id },
            relations: { place: true, user: true },
        });
    }
    async cancel(id) {
        const reservation = await this.findOne(id);
        if (!reservation)
            throw new common_1.NotFoundException('Reservation not found');
        if (reservation.status === 'cancelled') {
            throw new common_1.BadRequestException('Reservation already cancelled');
        }
        const place = await this.placeRepo.findOne({ where: { id: reservation.place.id } });
        if (place) {
            place.reserved = Math.max(0, place.reserved - 1);
            await this.placeRepo.save(place);
        }
        reservation.status = 'cancelled';
        return this.reservationRepo.save(reservation);
    }
    async remove(id) {
        const reservation = await this.findOne(id);
        if (!reservation)
            throw new common_1.NotFoundException('Reservation not found');
        return this.reservationRepo.remove(reservation);
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map