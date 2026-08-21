import { IsString, IsOptional } from 'class-validator';

export class CreateArtistProfileDto {
  @IsString()
  stage_name: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  banner_url?: string;
}