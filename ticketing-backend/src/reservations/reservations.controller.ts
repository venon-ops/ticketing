import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Req() request: any, @Body() dto: CreateReservationDto) {
    const userId = request.user.id;

    return this.reservationsService.create(userId, dto);
  }

  @Get()
  findAllByUser(@Req() request: any) {
    const userId = request.user.id;

    return this.reservationsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Req() request: any, @Param('id') id: string) {
    const userId = request.user.id;

    return this.reservationsService.findOne(id, userId);
  }

  @Post(':id/cancel')
  cancel(@Req() request: any, @Param('id') id: string) {
    const userId = request.user.id;

    return this.reservationsService.cancel(id, userId);
  }
}