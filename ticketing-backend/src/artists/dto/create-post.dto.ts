import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  media_url?: string;

  @IsString()
  @IsOptional()
  @IsIn(['image', 'video', 'audio', 'link'])
  media_type?: 'image' | 'video' | 'audio' | 'link';
}