import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FollowsService } from './follows.service';

type AuthRequest = {
  user: {
    sub?: string;
    userId?: string;
    id?: string;
  };
};

@Controller()
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('follows/:artistId')
  followArtist(
    @Req() request: AuthRequest,
    @Param('artistId') artistId: string,
  ) {
    const userId = request.user.sub || request.user.userId || request.user.id;
    return this.followsService.followArtist(userId!, artistId);
  }

  @Delete('follows/:artistId')
  unfollowArtist(
    @Req() request: AuthRequest,
    @Param('artistId') artistId: string,
  ) {
    const userId = request.user.sub || request.user.userId || request.user.id;
    return this.followsService.unfollowArtist(userId!, artistId);
  }

  @Get('follows')
  getFollowedArtists(@Req() request: AuthRequest) {
    const userId = request.user.sub || request.user.userId || request.user.id;
    return this.followsService.getFollowedArtists(userId!);
  }

  @Get('feed')
  getFeed(@Req() request: AuthRequest) {
    const userId = request.user.sub || request.user.userId || request.user.id;
    return this.followsService.getFeed(userId!);
  }
}
