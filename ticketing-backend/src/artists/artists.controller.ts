import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ArtistsService } from './artists.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateArtistProfileDto } from './dto/update-artist-profile.dto';

type AuthRequest = {
  user: {
    userId?: string;
    sub?: string;
    id?: string;
  };
};

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  getAllArtists() {
    return this.artistsService.getAllArtists();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@Req() request: AuthRequest) {
    const userId = request.user.userId || request.user.sub || request.user.id;

    return this.artistsService.getMyProfile(userId!);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateMyProfile(
    @Req() request: AuthRequest,
    @Body() dto: UpdateArtistProfileDto,
  ) {
    const userId = request.user.userId || request.user.sub || request.user.id;

    return this.artistsService.updateMyProfile(userId!, dto);
  }

  // Route publique : tout le monde peut consulter les publications d’un artiste.
  @Get(':artistId/posts')
  getPosts(@Param('artistId') artistId: string) {
    return this.artistsService.getPosts(artistId);
  }

  // Route protégée : seul le propriétaire de ce profil peut publier.
  @UseGuards(JwtAuthGuard)
  @Post(':artistId/posts')
  createPost(
    @Req() request: AuthRequest,
    @Param('artistId') artistId: string,
    @Body() dto: CreatePostDto,
  ) {
    const userId = request.user.userId || request.user.sub || request.user.id;

    return this.artistsService.createPost(userId!, artistId, dto);
  }

  // À conserver en dernier : sinon ":artistId" peut intercepter "me".
  @Get(':artistId')
  getArtistById(@Param('artistId') artistId: string) {
    return this.artistsService.getArtistById(artistId);
  }
}