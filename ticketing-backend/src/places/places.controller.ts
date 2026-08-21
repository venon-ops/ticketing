import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { ShareEventDto } from './dto/share-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

type AuthRequest = {
  user: {
    id?: string;
    userId?: string;
    sub?: string;
  };
};

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  findAll() {
    return this.placesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreatePlaceDto) {
    return this.placesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdatePlaceDto) {
    return this.placesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.placesService.remove(id);
  }

  @Post(':id/reserve')
  @UseGuards(JwtAuthGuard)
  reserve(@Param('id') id: string, @Req() request: AuthRequest) {
    const userId = request.user.id || request.user.userId || request.user.sub;

    return this.placesService.reserve(id, userId!);
  }

  // Public : récupérer l’annonce officielle de la soirée.
  @Get(':id/announcement')
  getAnnouncement(@Param('id') id: string) {
    return this.placesService.getAnnouncement(id);
  }

  // Admin : créer ou modifier l’annonce officielle.
  @Post(':id/announcement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createOrUpdateAnnouncement(
    @Param('id') id: string,
    @Body() dto: CreateEventAnnouncementDto,
  ) {
    return this.placesService.createOrUpdateAnnouncement(id, dto);
  }

  // Artiste programmé : repartager l’annonce officielle.
  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  shareAnnouncement(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() dto: ShareEventDto,
  ) {
    const userId = request.user.id || request.user.userId || request.user.sub;

    return this.placesService.shareAnnouncement(id, userId!, dto);
  }

  // Public : récupérer les événements repartagés par un artiste.
  @Get(':id/event-shares')
  getArtistEventShares(@Param('id') id: string) {
    return this.placesService.getArtistEventShares(id);
  }
}