import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateReservationDto {
  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  place_id?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled';
}